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