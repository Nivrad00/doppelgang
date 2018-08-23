const Discord = require('discord.js');
const client = new Discord.Client();

const Game = require('./Game');
const ResponseData = require('./ResponseData');
const config = require('./config');
const prefix = 'doppel';

var currentGame;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// returns true if the client user has the required permissions (and the server is up), else returns false

client.createdChannels = [];

client.checkPermissions = function (channel) {
    var guild = channel.guild;
    if (!guild.available) {
        channel.send('Guild is unavailable. Try again later.');
        return false;
    }
    else {
        var canManageChannels = guild.members.get(this.user.id).permissions.has(Discord.Permissions.FLAGS.MANAGE_CHANNELS);
        var canManageRoles = guild.members.get(this.user.id).permissions.has(Discord.Permissions.FLAGS.MANAGE_ROLES);
        var isAdmin = guild.members.get(this.user.id).permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR);

        if ((!canManageRoles || !canManageChannels) && !isAdmin) {
            channel.send('DoppelGang requires the Manage Channels and Manage Roles permissions to work. Please enable these permissions and try again.');
            return false;
        }
        else
            return true;
    }
}

client.exitGame = function () {
    client.createdChannels.forEach(function (element) {
        element.delete();
    });
    currentGame = undefined;
}

client.on('message', message => {
    var content = message.content;
    var author = message.author;
    var channel = message.channel;

    // prevent responding to self

    if (author == client.user)
        return;

    // easter egg

    if (content == 'doppel') {
        message.channel.send('gang!');
        return;
    }

    if (channel.type == 'dm') {
        if (currentGame) {
            var response = currentGame.messageHandler.handle(message); 
            if (response)
                channel.send(response);
        }
        return;
    }

    // tests for messages beginning with the prefix
    // space after prefix is mandatory for now

    var exec = new RegExp('^' + prefix + ' (.*)$').exec(content);
    var responseData;

    if (exec != null && !client.createdChannels.some(createdChannel => createdChannel.id == channel.id)) {
        responseData = handleCommand(exec[1].trim(), author, channel);
    
        // responds to commands using the ResponseData object and checks if the game is empty

        if (responseData && responseData.reply)
            message.reply(responseData.reply);
            
        if (currentGame && currentGame.playerCount == 0) {
            client.exitGame();
            channel.send('No players left; ending game. Deleting all DoppelGang channels.');
            return;
        }

        if (responseData && responseData.other)
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
                currentGame = new Game(author, channel, client);
                response = new ResponseData('Game started.', currentGame.menu);
            }
            break;
        
        case 'exit':
            if (!currentGame || currentGame.channel != channel)
                response = 'There is no game running in this channel.';
            else if (currentGame.partyLeader != author)
                response = 'Only the party leader can shut down the game.';
            else if (!currentGame.endConfirm) {
                currentGame.endConfirm = true;
                response = 'Are you sure you want to shut down the game? (Input `' + prefix + ' exit` to confirm or `' + prefix + ' cancel` to cancel.)';
            }
            else {
                client.exitGame();
                response = 'Game exited. Deleting all DoppelGang channels.';
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

// Chrono was here
    
client.login(config.token);