const Discord = require('discord.js');
const client = new Discord.Client();

const Game = require('./Game');
const ResponseData = require('./ResponseData');
const config = require('./config');
const prefix = 'doppel';

// var currentGame; // outdated
// var startConfirm = false; // outdated

var gamesMap = {}; // maps from channel id to game object
var playersMap = {}; // maps from user id to game object

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

client.exitGame = function (game) {
    var roundChannel = game.roundChannel;
    var gameChannel = game.channel;
    if (roundChannel && roundChannel.name == 'doppelgang') { // extra check to make sure it's named doppelgang
        roundChannel.delete('Exiting DoppelGang.');
        gameChannel.send('Deleted gameplay channel.');
    }
    delete gamesMap[gameChannel.id];
    for (var player of game.players)
        delete playersMap[player.id];
}

client.on('message', message => {
    var content = message.content;
    var author = message.author;
    var channel = message.channel;

    // prevent responding to self

    if (author == client.user)
        return;

    if (channel.type == 'dm') {
        if (playersMap.hasOwnProperty(author.id)) {
            var game = playersMap[author.id];
            var response = game.messageHandler.handle(message); 
            if (response)
                channel.send(response);
        }
        return;
    }

    // tests for messages beginning with the prefix
    // space after prefix is mandatory for now

    var exec = new RegExp('^' + prefix + ' (.*)$').exec(content);
    var responseData;
    var game = gamesMap[channel.id];

    // easter egg
    if (game && game.startConfirm) {
        if (author == game.players[0]) {
            game.startConfirm = false;
            channel.send(game.menu);
        }
    }
    else if (content == 'doppel') {
        message.channel.send('gang!');
        return;
    }
    else if (exec != null && !(game && game.roundChannel && game.roundChannel.id == channel.id)) {
        responseData = handleCommand(exec[1].trim(), author, channel, game);
    
        // responds to commands using the ResponseData object and checks if the game is empty 

        if (responseData && responseData.reply)
            message.reply(responseData.reply);
            
        if (game && game.playerCount == 0) {
            client.exitGame(game);
            channel.send('No players left. Exiting game.');
            return;
        }

        if (responseData && responseData.other) 
            channel.send(responseData.other);
    }
});

// always returns a ResponseData object
function handleCommand (command, author, channel, game) {
    var response = 'default';

    if (!game) {
        if (command == 'start') {
            if (playersMap.hasOwnProperty(author.id))
                response = 'You can\'t be in more than one game at a time.';
            else {
                var game = new Game(author, channel, client);
                gamesMap[channel.id] = game;
                playersMap[author.id] = game;

                response = new ResponseData('Game started. (Type anything to continue)', new Discord.Attachment('https://i.imgur.com/mtcBYF4.jpg'));
            }
        }
        else
            response = 'There is no game running in this channel.';
    }
    else {
        switch (command) {
            case 'start':
                response = 'A game is already running in this channel.';
                break;
            
            case 'exit':
                if (game.partyLeader != author)
                    response = 'Only the party leader can shut down the game.';
                else if (!game.endConfirm) {
                    game.endConfirm = true;
                    response = 'Are you sure you want to shut down the game? (Input `' + prefix + ' exit` to confirm or `' + prefix + ' cancel` to cancel.)';
                }
                else {
                    client.exitGame(game);
                    response = 'Game exited.';
                }   
                break;
            
            case 'cancel':
                if (game.endConfirm) {
                    game.endConfirm = false;
                    response = 'Okay, the game will continue.';
                }
                else
                    response = 'There is nothing to cancel right now.';
                break;
            
            case 'join':
                if (game.players.includes(author))
                    response = 'You\'re already in this game.';
                else if (playersMap.hasOwnProperty(author.id))
                    response = 'You can\'t join more than one game at a time.';
                else if (game.state != game.statesEnum.SETUP)
                    response = 'You can\'t join the game in the middle of a round.';
                else if (game.playerCount >= game.partyCapacity)
                    response = 'The game is already full (Max ' + game.partyCapacity + ' players).';
                else {
                    response = game.addPlayer(author);
                    playersMap[author.id] = game;
                }
                break;

            case 'leave':
                var index = game.players.indexOf(author);
                if (index == -1)
                    response = 'You\'re not in this game.';
                else if (game.state != game.statesEnum.SETUP)
                    response = 'You can\'t leave the game in the middle of a round.'
                else {
                    response = game.removePlayer(index);
                    delete playersMap[author.id];
                }
                break;

            case 'ready':
                response = game.ready(author);
                break;

            case 'help':
                response = game.help();
                break;

            default:
                response = 'Command not found.';
        }
    }

    if (typeof response == 'string')
        response = new ResponseData(response);

    return response;
}

// Chrono was here
    
client.login(config.token);