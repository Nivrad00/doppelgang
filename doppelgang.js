const Discord = require('discord.js');
const client = new Discord.Client();

const {Game, ResponseData} = require('./game');
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

    // easter egg

    if (content == 'doppel') {
        message.channel.send('gang!');
        return;
    }

    // tests for messages beginning with the prefix and gets the rest of the command
    // space after prefix is optional

    var exec = new RegExp('^' + prefix + '(.*)$').exec(content);
    var responseData;
    if (exec != null) {
        responseData = handleCommand(exec[1].trim(), author, channel);
    
        // respond to commands using the ResponseData object and checks if the game is empty

        if (responseData.reply)
            message.reply(responseData.reply);
            
        if (currentGame && currentGame.playerCount == 0) {
            currentGame = undefined;
            channel.send('No players left; ending game.');
            return;
        }

        if (responseData.other)
            channel.send(responseData.other);
    }
});

// always returns a ResponseData object
function handleCommand (command, author, channel) {
    var response = 'default';

    switch (command) {
        case 'start':
            if (currentGame) {
                if (currentGame.channel == channel)
                    response = 'A game is already running.';
                else
                    response = 'A game is already running in another channel.';
            }
            else {
                currentGame = new Game(author, channel);
                response = new ResponseData('Game started.', currentGame.menu);
            }
            break;
        
        case 'end':
            if (!currentGame || currentGame.channel != channel)
                response = 'There is no game running in this channel.';
            else if (currentGame.partyLeader != author)
                response = 'Only the party leader can end the game.';
            else if (!currentGame.endConfirm) {
                currentGame.endConfirm = true;
                response = 'Are you sure you want to end the game? (Input `' + prefix + ' end` to confirm or `' + prefix + ' cancel` to cancel.)';
            }
            else {
                currentGame = undefined;
                response = 'Game ended.';
            }   
            break;
        
        case 'cancel':
            if (currentGame && currentGame.channel == channel && currentGame.endConfirm) {
                currentGame.endConfirm = false;
                response = 'Okay, the game will continue.';
            }
            else
                response = 'There is nothing to cancel right now.';
            break;
        
        case 'join':
            if (currentGame && currentGame.channel == channel) {
                response = currentGame.addPlayer(author);
            }
            else
                response = 'There is no game running in this channel.';
            break;

        case 'leave':
            if (currentGame && currentGame.channel == channel) {
                response = currentGame.removePlayer(author);
            }
            else
                response = 'There is no game running in this channel.';
            break;

        case 'ready':
            if (currentGame && currentGame.channel == channel)
                response = currentGame.ready(author);
            else
                response = 'There is no game running in this channel.';
            break;

        default:
            response = 'Command not found.';
    }

    if (typeof response == 'string')
        response = new ResponseData(response);

    return response;
}
    
client.login(config.token);
