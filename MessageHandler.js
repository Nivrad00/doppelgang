class MessageHandler {
    constructor (game) {
        this.game = game;
    }

    handle (message) {
        var round = this.game.round;
        if (!round)
            return;
        if (round.state == round.statesEnum.PREFERENCES) {
            var content = message.content.toLowerCase();
            if (content == 'doppelganger' || content == 'adventurer')
                return round.setPref(message.author, content);
            else
                return 'Please input either "doppelganger" or "adventurer."';
        }
    }
}

module.exports = MessageHandler;