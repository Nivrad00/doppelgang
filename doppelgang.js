const Discord = require('discord.js');
const client = new Discord.Client();

const Game = require('./game');
const config = require('./config');
const prefix = 'doppel';
var currentGame;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
    var content = message.content;
    var author = message.author;
    var channel = message.channel;

    if (content == 'doppel')
        message.channel.send('gang!');

    // tests for messages beginning with the prefix and gets the rest of the command
    // space after prefix is optional

    var exec = new RegExp('^' + prefix + '(.*)$').exec(content); 
    if (exec != null)
        message.reply(handleCommand(exec[1].trim(), author, channel));
});

function handleCommand (command, author, channel) {
    switch (command) {
        case 'start':
            if (currentGame) {
                if (currentGame.channel == channel)
                    return 'A game is already running.';
                else
                    return 'A game is already running in another channel.';
            }
            else {
                currentGame = new Game(author, channel);
                    return 'Game started.';
            }
            break;
        
        case 'end':
            if (currentGame && currentGame.channel == channel) {
                if (currentGame.partyLeader == author) {
                    if (currentGame.endConfirm) {
                        currentGame = undefined;
                        return 'Game ended.';
                    }
                    else {
                        currentGame.endConfirm = true;
                        return 'Are you sure you want to end the game? (Input `' + prefix + ' end` to confirm or `' + prefix + ' cancel` to cancel.)';
                    }
                }
                else
                    return 'Only the party leader can end the game.';
            }
            else
                return 'There is no game running in this channel.';
            break;
        
        case 'cancel':
            if (currentGame && currentGame.channel == channel && currentGame.endConfirm) {
                currentGame.endConfirm = false;
                return 'Okay, the game will continue.';
            }
            else
                return 'There is nothing to cancel right now.';
            break;
        
        default:
            return 'Command not found.';
    }
}
    
client.login(config.token);
