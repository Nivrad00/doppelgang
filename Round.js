const Game = require('./Game');

// should handle channel creation/deletion, role preferences, role/color assignment, round timer, end-round voting, kill voting

class Round {
    constructor (game, id) {
        this.id = id;
        this.game = game;
        this.channel; // the channel that gameplay takes place in, not the channel where the game is initiated
        this.prefTimeLimit = 15; // in seconds
        this.roundTimeLimit = 10; // in minutes

        // properties for role setting

        this.unsetPref = [];
        this.doppelCandidates = [];
        this.adventurers = [];
        this.doppelganger;

        // map for each player's color

        this.colorHexes = {
            RED: 'FF0000',
            GREEN: '00FF00',
            BLUE: '0000FF',
            MAGENTA: 'FF00FF',
            YELLOW: 'FFFF00',
            CYAN: '00FFFF'
        };
        this.colorArray = Object.keys(this.colorHexes);
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

    // fills this.colorMap, mapping from player id to color. if there are no colors left to be assigned, the player is assigned 'NONE'.
    setColors () {
        var players = this.game.players.slice(0);
        this.shuffleArray(players);
        for (var i = 0; i < players.length; i ++) {
            if (i < this.colorArray.length)
                this.colorMap[players[i].id] = this.colorArray[i];
            else
                this.colorMap[players[i].id] = 'NONE';
        }
        console.log(this.colorMap);
    }

    // current issue: simultaneous splicing?
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
        
        // pref state end logic
        var round = this;
        setTimeout(function () {
            if (round.unsetPref.length == 0)
                round.startDiscussion();
        }, 50);
        return response;
    }

    startDiscussion () {        
        var scenarios = [
            'having a round of beer to celebrate their most recent victory,',
            'setting up camp in a forest clearing',
            'hiking up a treacherous mountain path',
            'seeking an ancient treasure in the desert',
            'in the middle of a D&D campaign',
            'in the middle of a heated game of Uno',
            'investigating an abandoned mansion',
            'exploring an underground dungeon',
            'in the middle of a long road trip',
            'hitching a ride in an empty train wagon',
            'setting up camp in an abandoned barn',
            'barhopping throughout the city',
            'taking a nice walk in the park',
            'hard at work at the office',
            'playing a match of Overwatch',
            'riding a Ferris wheel at the fair',
            'riding an elevator to the top of a skyscraper',
            'hiking through a wild jungle',
            'piloting their spaceship through the Orion Nebula',
            'having breakfast at IHOP',
            'infiltrating the HQ of a nefarious tech corporation',
            'digging for the remains of an ancient civilization',
            'preparing a herd of goats for ritual sacrifice',
            'exploring a cave system full of monsters',
            'hiding from zombies in an abandoned mall',
            'riding a giant bird over the countryside'
        ];
        
        var names = this.adventurers.map(a => a.username);
        var intro = names.slice(0, names.length - 1).join(', ') + ' and ' + names[names.length - 1] 
            + ' were ' + scenarios[(scenarios.length * Math.random()) << 0] + ' when they realized something was wrong: Their party had increased by one!\r\n'
            + '**Find the doppelganger!**\r\n'
            + '(Round will end in ' + this.roundTimeLimit + ' minutes)';

        this.setRoles();
        this.setColors();

        // todo: tell the doppelganger every other player's color; include a link to the newly created channel.

        for (var player of this.game.players) {
            var str = 'Your color is **' + this.colorMap[player.id].toLowerCase() + '**.\r\n';
            if (player == this.doppelganger) {
                str += 'You are the **doppelganger**.\r\n'
                     + 'Goal: Convince the party not to kill you by impersonating one of the adventurers.\r\n';
            }
            else {
                str += 'You are an **adventurer.**\r\n'
                     + 'Goal: Figure out which player is the doppelganger, then collectively vote to kill them.\r\n';
            }
            str += 'Type messages here to send them to the #doppelgang channel.';

            player.send(str);
        }

        this.makeRoundChannel(intro);
        this.state = this.statesEnum.DISCUSSION;
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

        // pref state timeout logic
        var round = this;
        setTimeout(function () {
            if (round.state == round.statesEnum.PREFERENCES) {
                for (var player of round.unsetPref) {
                    player.send('Preference automatically set to doppelganger.').catch(() => this.unableToMessageAlert(round.game.channel, player));
                    round.doppelCandidates.push(player);
                }
                round.unsetPref = [];
                round.startDiscussion();
            }
        }, this.prefTimeLimit * 1000);
    }

    makeRoundChannel (intro) {
        var round = this;
        var guild = this.game.guild;
        var players = this.game.players;
        var bot = this.game.client.user;

        guild.createChannel("doppelgang", "text", undefined, "Gameplay channel for DoppelGang round " + this.id).then(
            function (channel) {
                channel.overwritePermissions(guild.defaultRole, { 'VIEW_CHANNEL': false });
                for (var player of players)
                    channel.overwritePermissions(player, { 'VIEW_CHANNEL': true, 'SEND_MESSAGES': false });
                channel.overwritePermissions(bot, { 'VIEW_CHANNEL': true, 'SEND_MESSAGE': true }).then(() => channel.send(intro));
                round.channel = channel;
            }
        )
    }

}

module.exports = Round;