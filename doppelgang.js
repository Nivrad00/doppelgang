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
    // space after prefix is optional, in case we decide to use a symbol instead of a word

    var exec = new RegExp('^' + prefix + '(.*)$').exec(content);
    var responseData;
    if (exec != null) {
        responseData = handleCommand(exec[1].trim(), author, channel);
    
        // responds to commands using the ResponseData object and checks if the game is empty

        if (responseData && responseData.reply)
            message.reply(responseData.reply);
            
        if (currentGame && currentGame.playerCount == 0) {
            currentGame = undefined;
            channel.send('No players left; ending game.');
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