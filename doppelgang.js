
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
  if (message.content == "doppel")
    message.reply("gang!");
}

client.login(); // key goes here
