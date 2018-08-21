const Game = require('./Game');

// should handle channel creation/deletion, role preferences, role/color assignment, round timer, end-round voting, kill voting

class Round {
    constructor (game, id) {
        this.id = id;
        this.game = game;
        this.channel; // the channel that gameplay takes place in, not the channel where the game is initiated

        this.makeRoundChannel();
        this.set
    }

    makeRoundChannel () {
        var round = this;
        var guild = this.game.guild;
        var players = this.game.players;
        var bot = this.game.client.user;

        guild.createChannel("doppelgang", "text", undefined, "Gameplay channel for DoppelGang round " + this.id).then(
            function (channel) {
                channel.overwritePermissions(guild.defaultRole, { 'VIEW_CHANNEL': false });
                for (var player of players)
                    channel.overwritePermissions(player, { 'VIEW_CHANNEL': true, 'SEND_MESSAGES': false });
                channel.overwritePermissions(bot, { 'VIEW_CHANNEL': true });
                round.channel = channel;
            }
        )
    }

}

module.exports = Round;