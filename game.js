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
        this.roundChannel; // the channel that the gameplay takes place in
        this.guild = channel.guild
        this.endConfirm = false;
        this.startConfirm = true;
        this.players = [partyLeader];
        this.partyCapacity = 6;
        this.client = client;
        this.messageHandler = new MessageHandler(this);
        this.roundID = 1;
        this.round;
        this.statesEnum = {
            SETUP: 0,
            PLAYING: 1
        }
        this.state = this.statesEnum.SETUP;
    }

    help () {
        var text = [
            '**Permissions**',
            'DoppelGang requires the Manage Channels and Manage Roles permissions, and the ability to send DMs to the players.',
            '',
            '**Overview**',
            'During a round of DoppelGang, players communicate anonymously with each other by sending the bot DMs, which are transferred to the gameplay channel with only a color to identify the sender. One player is the doppelganger, and the rest are adventurers. The adventurers must figure out which player is the doppelganger, then collectively vote to kill them. The doppelganger\'s goal is to survive by impersonating one of the adventurers, tricking them into killing one of their own.',
            '',
            '**Setup**',
            'Players can join and leave the game using the "leave" and "join" commands. Once the party leader starts the round with the "ready" command, each player is asked via DM to set a preference for doppelganger or adventurer. The bot automatically assigns the players their roles and colors, then creates the gameplay channel and starts the discussion.',
            '',
            '**Gameplay**',
            'The discussion lasts for ten minutes, during which the players should try to reach a consensus on who to kill. The players can vote to end the discussion early at any time by sending "vote end" to the bot. After the discussion ends, each player is prompted via DM to enter the color of the player they want to kill. If the doppelganger receives the most votes, they are killed and the adventurers win. If any of the adventures receive the most votes, the doppelganger wins. A tie also results in the doppelganger winning.',
            '',
            '**Protip:** Press CTRL/CMD + K on Discord to quickly switch between your DM and the gameplay channel.',
            '',
            'Made by Nivrad00, Zach, and Chronocide.'
        ];
        this.channel.send(text.join('\r\n'));
    }
    
    get menu () {
        var text = [
            '**DoppelGang**',
            'Your party has been infiltrated by a shapeshifting doppelganger! Can you figure out who\'s who before it\'s too late?',
            'A Discord bot game for 3-6 players.',
            '',
            '**Available commands**',
            '* `' + prefix + ' ready`:  Start a round of DoppelGang.',
            '* `' + prefix + ' help`:  Get information about DoppelGang.',
            '* `' + prefix + ' join`:  Join the game.',
            '* `' + prefix + ' leave`:  Leave the game.',
            '* `' + prefix + ' exit`:  Exit DoppelGang.',
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

    endRound () {
        this.state = this.statesEnum.SETUP;
        this.round = undefined;
    }

    addPlayer (user) {
        this.players.push(user);
        return new ResponseData('Added to game.', this.menu);
    }
    
    removePlayer (index) {;
        if (this.players[index] == this.partyLeader) {
            this.players.splice(index, 1);
            this.partyLeader = this.players[0];
        }
        else
            this.players.splice(index, 1);
        return new ResponseData('Removed from game.', this.menu);
    }

    get playerCount () {
        return this.players.length;
    }
}

module.exports = Game;