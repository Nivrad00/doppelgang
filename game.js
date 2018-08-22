const prefix = 'doppel'; // this is repeated from doppelganger.js but whatever
const Discord = require('discord.js');
const Round = require('./Round');
const ResponseData = require('./ResponseData');
const MessageHandler = require('./MessageHandler');

// handles starting/ending games, building parties, and starting rounds

class Game {
    constructor (partyLeader, channel, client) {
        this.partyLeader = partyLeader;
        this.channel = channel; // the channel that the game is initiated in, not the one that gameplay takes place in
        this.guild = channel.guild
        this.endConfirm = false;
        this.players = [partyLeader];
        this.partyCapacity = 6;
        this.client = client;
        this.messageHandler = new MessageHandler(this);
        this.roundID = 0;
        this.round;
        this.statesEnum = {
            SETUP: 0,
            PLAYING: 1
        }
        this.state = this.statesEnum.SETUP;
    }

    get menu () {
        var text = [
            '**DoppelGang**',
            'A game that you can play with your "friends!"',
            '(Please make sure that you are able to receive PMs from the DoppelGang bot.)',
            '',
            '**Available commands**',
            '* `' + prefix + ' ready`:  Start a round of DoppelGang.',
            '* `' + prefix + ' join`:  Join the game.',
            '* `' + prefix + ' leave`:  Leave the game.',
            '* `' + prefix + ' end`:  Exit DoppelGang.',
            '',
            '**Players**',
            this.formattedPlayerList
        ];
        return text.join('\r\n');
    }

    get formattedPlayerList () {
        var text = [];

        for (var player of this.players) {
            if (this.partyLeader == player)
                text.push('* ' + player.username + ' (Party leader)');
            else
                text.push('* ' + player.username);
        }

        return text.join('\r\n');
    }

    ready (user) {
        if (this.state != this.statesEnum.SETUP)
            return 'The round has already started.';
        else if (this.partyLeader != user)
            return 'Only the party leader can start the round.';
        // else if (this.playerCount < 3)
        //     return 'You need at least three players to play DoppelGang.';
        else if (this.client.checkPermissions(this.channel)) {
            this.state = this.statesEnum.PLAYING;
            this.round = new Round(this, this.roundID);
            this.roundID ++;
            return 'Starting round. Asking all players for role preference.';
        }
        else
            return '';
    }

    addPlayer (user) {
        if (this.players.includes(user))
            return 'You\'re already in the game.';
        else if (this.state != this.statesEnum.SETUP)
            return 'You can\'t join the game in the middle of a round.';
        else if (this.playerCount >= this.partyCapacity)
            return 'The game is already full (Max ' + this.partyCapacity + ' players).';
        else {
            this.players.push(user);
            return new ResponseData('Added to game.', this.menu);
        }
    }
    
    removePlayer (user) {
        var index = this.players.indexOf(user);
        if (index == -1)
            return 'You\'re not in the game.';
        else if (this.state != this.statesEnum.SETUP)
            return 'You can\'t leave the game in the middle of a round.';
        else {
            if (this.players[index] == this.partyLeader) {
                this.players.splice(index, 1);
                this.partyLeader = this.players[0];
            }
            else
                this.players.splice(index, 1);
            return new ResponseData('Removed from game.', this.menu);
        }
    }

    get playerCount () {
        return this.players.length;
    }
}

module.exports = Game;