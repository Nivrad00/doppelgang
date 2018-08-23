const Game = require('./Game');

// should handle channel creation/deletion, role preferences, role/color assignment, round timer, end-round voting, kill voting

class Round {
    constructor (game, id) {
        this.id = id;
        this.game = game;
        this.channel; // the channel that gameplay takes place in, not the channel where the game is initiated
        this.prefTimeLimit = 15;

        // properties for role setting

        this.unsetPref = [];
        this.doppelCandidates = [];
        this.adventurers = [];
        this.doppelganger;

        // map for each player's color

        this.colorHexes = {
            RED: 'FF0000',
            BLUE: '00FF00',
            GREEN: '0000FF',
            YELLOW: 'FF00FF',
            MAGENTA: 'FFFF00',
            CYAN: '00FFFF'
        };
        this.colorArray = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'MAGENTA', 'CYAN'];
        this.colorMap = {};

        // states

        this.statesEnum = {
            INACTIVE: 0,
            PREFERENCES: 1,
            DISCUSSION: 2,
            VOTING: 3,
            ENDING: 4
        };
        this.state = this.statesEnum.INACTIVE;
        
        this.promptPref();
    }

    // implementation of Durstenfield shuffle, by Laurens Holst on StackOverflow
    shuffleArray (array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }

    setColors () {
        var players = this.game.players.slice(0);
        this.shuffleArray(players);
        for (var i = 0; i < players.length; i ++) {
            this.colorMap[this.colorArray[i]] = players[i];
        }
        console.log(this.colorMap);
    }

    setRoles () {
        if (this.doppelCandidates.length > 0) {
            var index = (this.doppelCandidates.length * Math.random()) << 0;
            this.doppelganger = this.doppelCandidates[index];
            this.doppelCandidates.splice(index, 1);
            this.adventurers = this.adventurers.concat(this.doppelCandidates);
        } 
        else {
            var index = (this.adventurers.length * Math.random()) << 0;
            this.doppelganger = this.adventurers[index];
            this.adventurers.splice(index, 1);
        }
        console.log(this.doppelganger);
        console.log(this.adventurers);
    }

    setPref (player, pref) {
        var response;

        if (!this.game.players.includes(player))
            console.log('Tried to set the preferences of a player who doesn\'t exist');

        else if (!this.unsetPref.includes(player))
            response = 'Your preference is already set.';

        else if (pref == 'doppelganger') {
            this.doppelCandidates.push(player);
            this.unsetPref.splice(this.unsetPref.indexOf(player), 1);
            response = 'Preference set to doppelganger.';
        }
        else if (pref == 'adventurer') {
            this.adventurers.push(player);
            this.unsetPref.splice(this.unsetPref.indexOf(player), 1);
            response = 'Preference set to adventurer.';
        }
        else
            console.log('Something went wrong with preference setting');
        
        var round = this;
        setTimeout(function () {
            if (round.unsetPref.length == 0) {
                round.setRoles();
                round.setColors();
                round.makeRoundChannel();
                round.state = round.statesEnum.DISCUSSION;
            }
        }, 50);
        return response;
    }

    unableToMessageAlert (channel, player) {
        channel.send('<@' + player.id + '>, Please make sure you are able to receive messages from the DoppelGang bot.')
    }

    promptPref () {
        var players = this.game.players;
        var str = 'Set your role preference: "doppelganger" or "adventurer."\r\n(If you don\'t respond within ' + this.prefTimeLimit + ' seconds, your preference will be automatically set to doppelganger.)';
        this.state = this.statesEnum.PREFERENCES;
        this.unsetPref = players.slice(0);

        for (var player of players)
            player.send(str).catch(() => this.unableToMessageAlert(this.game.channel, player));
    }

    makeRoundChannel () {
        var round = this;
        var guild = this.game.guild;
        var players = this.game.players;
        var bot = this.game.client.user;

        // Check if the channel(s) already exists, and if it does, delete it
        guild.channels.array().forEach(function(element) {
            if (element.name == 'doppelgang') {
                console.log('Duplicate channels found, trying to delete them now')
                guild.channels.get(element.id).delete('Duplicate channel');
            }
        });

        guild.createChannel("doppelgang", "text", undefined, "Gameplay channel for DoppelGang round " + this.id).then(
            function (channel) {
                channel.overwritePermissions(guild.defaultRole, { 'VIEW_CHANNEL': false });
                for (var player of players)
                    channel.overwritePermissions(player, { 'VIEW_CHANNEL': true, 'SEND_MESSAGES': false });
                channel.overwritePermissions(bot, { 'VIEW_CHANNEL': true, 'SEND_MESSAGE': true }).then(() => channel.send('introduction message'));
                round.channel = channel;
            }
        )
    }

}

module.exports = Round;