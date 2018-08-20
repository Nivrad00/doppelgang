class Game {
    constructor (partyLeader, channel) {
        this.partyLeader = partyLeader;
        this.channel = channel;
        this.endConfirm = false;
        this.players = [partyLeader];
        
        this.statesEnum = {
            SETUP: 0,
            PLAYING: 1
        }
        this.state = this.statesEnum.SETUP;
    }

    ready (user) {
        if (this.state != this.statesEnum.SETUP)
            return 'The round has already started.';
        else if (this.partyLeader != user)
            return 'Only the party leader can start the round.';
        else {
            this.state = this.statesEnum.PLAYING;
            return 'The round has started!';
        }
    }

    addPlayer (user) {
        if (this.players.includes(user))
            return 'You\'re already in the game.';
        else if (this.state != this.statesEnum.SETUP)
            return 'You can\'t join the game in the middle of a round.';
        else {
            this.players.push(user);
            return 'Added to game.';
        }
    }
    
    removePlayer (user) {
        var index = this.players.indexOf(user);
        if (index == -1)
            return 'You\'re not in the game.';
        else if (this.state != this.statesEnum.SETUP)
            return 'You can\'t leave the game in the middle of a round.';
        else {
            this.players.splice(index, 1);
            return 'Removed from game.';
        }
    }

    get playerCount () {
        return this.players.length;
    }
}

module.exports = Game;