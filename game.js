class Game {
    constructor (partyLeader, channel) {
        this.partyLeader = partyLeader;
        this.channel = channel;
        this.endConfirm = false;
        this.players = [partyLeader];
    }
}

module.exports = Game;