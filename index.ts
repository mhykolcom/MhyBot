// require the discord.js module
const Discord = require('discord.js');

// create a new Discord client
const client = new Discord.Client();

// Import config
const { prefix, discordtoken, twitchtoken } = require('./config/config.json');

// when the client is ready, run this code
// this event will trigger whenever your bot:
// - finishes logging in
// - reconnects after disconnecting
client.on('ready', () => {
    console.log('Ready!');
});

// login to Discord with your app's token
client.login(discordtoken);

const exampleEmbed = new Discord.RichEmbed()
    .setColor('#0099ff')
    .setTitle('https://twitch.tv/mhykol')
    .setURL('https://twitch.tv/mhykol')
    .setAuthor('Mhykol has gone live on Twitch', 'https://i.imgur.com/wSTFkRM.png', 'https://twitch.tv/mhykol')
    
    .setThumbnail('https://i.imgur.com/wSTFkRM.png')
    .addField('Now Playing', 'Game')
    .addField('Title', 'Junk')
    .setTimestamp()
    .setFooter('Twitch Live Bot by Mhykol', 'https://i.imgur.com/wSTFkRM.png');

client.on('message', message => {
    if (message.content == "!test") {
        message.channel.send(exampleEmbed)
    }
});

