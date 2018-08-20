// for when a response requires both replying to a message and sending additional info to the channel
class ResponseData {
    constructor (reply, other) {
        this.reply = reply;
        this.other = other;
    }
}