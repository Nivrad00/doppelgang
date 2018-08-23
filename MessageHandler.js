const Discord = require('discord.js');
const prefix = 'doppel'; // fuck it i'm basically copying this to every file at this point

class MessageHandler {
    constructor (game) {
        this.game = game;
    }

    handle (message) {
        var round = this.game.round;
        if (!round || !this.game.players.includes(message.author))
            return;
        else if (round.state == round.statesEnum.PREFERENCES) {
            var content = message.content.toLowerCase();
            if (content == 'doppelganger' || content == 'adventurer')
                return round.setPref(message.author, content);
            else
                return 'Please input either "doppelganger" or "adventurer."';
        }
        else if (round.state == round.statesEnum.DISCUSSION) {
            if (message.content == 'vote end')
                round.voteEnd(message.author);
            else {
                var color = round.colorMap[message.author.id];
                var hex = round.colorHexes[color];
                if (!hex)
                hex = '888888';
                var content = message.content;
                
                var embed = new Discord.RichEmbed();
                embed.setColor(hex);
                embed.setDescription(content);
                round.channel.send(embed);
            }
        }
        else if (round.state == round.statesEnum.VOTING) {
            var content = message.content.toLowerCase();
            return round.voteKill(message.author, content);
        }
    }
}

module.exports = MessageHandler;