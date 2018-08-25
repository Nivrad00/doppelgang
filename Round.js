const Game = require('./Game');

// should handle channel creation/deletion, role preferences, role/color assignment, round timer, end-round voting, kill voting

class Round {
    constructor (game, id) {
        this.id = id;
        this.game = game;
        this.channel; // the channel that gameplay takes place in, not the channel where the game is initiated
        this.prefTimeLimit = 15; // in seconds
        this.killVoteTimeLimit = 30; // in seconds
        this.endVoteTimeLimit = 15; // in seconds
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
        this.colorMap = {}; // maps from ID to color

        // voting to end

        this.endVoteMap = {} // maps from ID to whether they've voted to end or not (true/false)
        this.wipeEndVotes();

        // voting to kill

        this.notVoted = [];
        this.killVoteMap = {}; // maps from color to how many votes they've received
        // can't fill killVoteMap yet because colorMap has to be filled first

        // states

        this.statesEnum = {
            INACTIVE: 0,
            PREFERENCES: 1,
            DISCUSSION: 2,
            VOTING: 3
        };
        this.state = this.statesEnum.INACTIVE;
        
        this.promptPref();
    }

    // number of people who have voted to end the round
    get endVoteCount () {
        return Object.values(this.endVoteMap).filter(a => a).length;
    }

    // reset map of votes to kill
    wipeKillVotes () {
        for (var player of this.game.players) {
            this.killVoteMap[this.colorMap[player.id]] = 0;
        }
    }

    // reset map of votes to end
    wipeEndVotes () {
        for (var player of this.game.players)
            this.endVoteMap[player.id] = false;
    }

    // process a single vote to end the round
    voteEnd (player) {
        if (this.endVoteMap[player.id])
            player.send('You\'ve already voted to end the discussion.');
        else {
            player.send('Vote received.');
            this.endVoteMap[player.id] = true;
            this.channel.send(this.colorMap[player.id] + ' has voted to end the discussion.\r\n'
                + 'Total votes: ' + this.endVoteCount + '/' + this.game.players.length + ' (' + (this.game.players.length - 1) + ' votes needed)');

            if (this.endVoteCount >= this.game.players.length - 1) {
                this.endDiscussion();
            }
            
            var round = this;
            if (this.endVoteCount == 1) {
                setTimeout(function () {
                    if (round.state == round.statesEnum.DISCUSSION) {
                        round.channel.send('Not enough votes. Discussion will continue.');
                        round.wipeEndVotes();
                    }
                }, this.endVoteTimeLimit * 1000);
            }
        }
    }

    // end the voting stage
    endVoting () {
        var str = '**Vote Results**';

        // print the vote results
        for (var color of Object.keys(this.killVoteMap)) {

            // retrieve the player ID that corresponds to the color
            var playerID;
            for (var id of Object.keys(this.colorMap)) {
                if (this.colorMap[id] == color)
                    playerID = id;
            }
            str += '\r\n* ' + color + ' <@' + playerID + '>: ' + this.killVoteMap[color] + ' vote' + (this.killVoteMap[color] == 1 ? '' : 's'); 
        }

        this.channel.send(str);

        // figure out who was killed
        var round = this;
        var deadPlayers = this.game.players.reduce(function (collector, player) {
                if (collector.length == 0) {
                    collector.push(player);
                    return collector;
                }
                var playerVotes = round.killVoteMap[round.colorMap[player.id]]; // how many votes the player got
                var maxVotes = round.killVoteMap[round.colorMap[collector[0].id]]; // how many votes the players in collector got

                if (playerVotes == maxVotes)
                    collector.push(player);
                else if (playerVotes > maxVotes)
                    collector = [player];

                return collector;
            }, []);

        if (deadPlayers.length > 1) {
            str = 'The party couldn\'t decide who to kill, and the doppelganger, ' + this.doppelganger + ', went free...\r\n';
            str += '**The doppelganger wins!**\r\n';
        }
        else if (this.doppelganger == deadPlayers[0]) {
            str = 'The party decided to kill ' + this.colorMap[deadPlayers[0].id] + ', who turned out to be the doppelganger, ' + deadPlayers[0] + '.\r\n';
            str += '**The adventurers win!**\r\n';
        } 
        else {
            str = 'The party decided to kill ' + this.colorMap[deadPlayers[0].id] + ', who turned out to be an adventurer, ' + deadPlayers[0] + '.\r\n';
            str += '**The doppelganger wins!**\r\n';
        }

        str += '(Return to the channel where the game was started to start another round.)';

        this.channel.send(str);

        // unlock channel and reset states
        
        for (var player of this.game.players)
            this.channel.overwritePermissions(player, { 'VIEW_CHANNEL': true, 'SEND_MESSAGES': true });

        this.state = this.statesEnum.INACTIVE;
        this.game.endRound();

        // and send the menu again
        this.game.channel.send(this.game.menu);
    }

    // process a single vote to kill
    voteKill (player, vote) {
        var response;
        var colors = Object.values(this.colorMap).map(a => a.toLowerCase());

        if (!this.game.players.includes(player))
            console.log('Tried to set a kill vote for a player who doesn\'t exist');

        else if (!colors.includes(vote))
            response = 'Please enter one of the colors listed above.';

        else if (!this.notVoted.includes(player))
            response = 'You have already voted.';

        else {
            response = 'Voted to kill ' + vote.toUpperCase() + '.';
            this.notVoted.splice(this.notVoted.indexOf(player), 1);
            this.killVoteMap[vote.toUpperCase()] ++;
        }

        // vote state end logic
        var round = this;
        setTimeout(function () {
            if (round.notVoted.length == 0)
                round.endVoting();
        }, 50);
        return response;
    }

    // end the discussion stage
    endDiscussion () {
        this.state = this.statesEnum.VOTING;
        this.wipeKillVotes(); // sets up this.killVoteMap
        this.channel.send('Discussion is over. Asking players to vote for who to kill.');
        
        var str = 'Vote for the person you think is the doppelganger.\r\n(If you don\'t respond within ' + this.killVoteTimeLimit + ' seconds, your vote will be forfeited.)';
        var colors = Object.values(this.colorMap);
        var players = this.game.players;

        for (var color of colors)
            str += '\r\n* ' + color;
            
        this.notVoted = players.slice(0);

        for (var player of players)
            player.send(str).catch(() => this.unableToMessageAlert(this.game.channel, player));

        // vote state timeout logic
        var round = this;
        setTimeout(function () {
            if (round.state == round.statesEnum.VOTING) {
                for (var player of round.notVoted)
                    player.send('Out of time; vote forfeited.').catch(() => this.unableToMessageAlert(round.game.channel, player));
                round.notVoted = [];
                round.endVoting();
            }
        }, this.killVoteTimeLimit * 1000);
        
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
        console.log('doppelganger: ' + this.doppelganger.username);
        console.log('adventurers: ', this.adventurers.map(a => a.username));
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
            'having a round of beer to celebrate their most recent victory',
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
            'riding a giant bird over the countryside',
            'investigating the theft of the royal jewels'
        ];

        // set roles and colors

        this.setRoles();
        this.setColors();
        
        // make the channel and send the intro message

        var names = this.adventurers;
        var intro = names.slice(0, names.length - 1).join(', ') + ' and ' + names[names.length - 1] 
            + ' were ' + scenarios[(scenarios.length * Math.random()) << 0] + ' when they realized that their party had increased by one.\r\n'
            + '**Find the doppelganger!**\r\n'
            + '(Discussion will end automatically in ' + this.roundTimeLimit + ' minutes.)';
            
        this.makeRoundChannel(intro);
        this.game.roundChannel = this.channel;

        // notify players with relevant info

        for (var player of this.game.players) {
            var str = 'Your color is **' + this.colorMap[player.id] + '**.\r\n';
            if (player == this.doppelganger) {
                str += 'You are the **doppelganger**.\r\n'
                     + 'Goal: Convince the party not to kill you by impersonating one of the adventurers.\r\n';
            }
            else {
                str += 'You are an **adventurer**.\r\n'
                     + 'Goal: Figure out which player is the doppelganger, then collectively vote to kill them.\r\n';
            }
            // 'https://discordapp.com/channels/' + this.channel.guild.id + '/' + this.channel.id + '/' + startMessageID
            str += 'Type messages here to send them to the #doppelgang channel. To vote to end the discussion, type `vote end`.';

            player.send(str);
        }


        this.state = this.statesEnum.DISCUSSION;

        // start the timers
        var round = this;

        setTimeout(function () {
            if (round.state == round.statesEnum.DISCUSSION)
                round.channel.send('One minute left in the discussion. Hurry up!');
        }, (round.roundTimeLimit - 1) * 60 * 1000);


        setTimeout(function () {
            if (round.state == round.statesEnum.DISCUSSION)
                round.channel.send('Discussion ending in ten seconds. Decide quickly!');
        }, (round.roundTimeLimit * 60 - 10) * 1000);

        setTimeout(function () {
            if (round.state == round.statesEnum.DISCUSSION)
                round.endDiscussion();
        }, round.roundTimeLimit * 60 * 1000);
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
        // if there's no gameplay channel yet, it makes one
        var round = this;
        if (!this.game.roundChannel) {            
            this.game.guild.createChannel("doppelgang", "text", undefined, "Gameplay channel for DoppelGang").then(
                function (channel) {
                    round.setPermissions(channel, intro);
                    round.game.roundChannel = channel;
                    round.channel = channel;
                }
            )
        }
        // else reuses the gameplay channel from the previous round
        else {
            this.channel = this.game.roundChannel;
            Object.values(this.channel.permissionOverwrites).forEach(a => a.delete); // clear overwrites
            this.setPermissions(this.channel, intro);
        }
    }

    setPermissions (channel, intro) {
        channel.overwritePermissions(this.game.guild.defaultRole, { 'VIEW_CHANNEL': false });
        for (var player of this.game.players)
            channel.overwritePermissions(player, { 'VIEW_CHANNEL': true, 'SEND_MESSAGES': false });
        channel.overwritePermissions(this.game.client.user, { 'VIEW_CHANNEL': true, 'SEND_MESSAGE': true }).then(() => channel.send(intro));
    }
}

module.exports = Round;