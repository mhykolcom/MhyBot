module.exports = {
    name: 'resub',
    category: "Management",
    description: 'Forces the bot to resub to all YouTube channels.',
    aliases: [],
    args: false,
    usage: '',
    permission: 'botowner',
    hidden: true,
    execute(client, message, args) {
        var server = client.currentserver;
        server.youtubeChannels.forEach((channel) => {
            var topic = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channel.id}`
            client.pubsub.subscribe(topic, client.pubsub.hub, function (err) {
                if (err) {
                    message.reply(`Error resubscribing to YouTube Channel: ${channel.name}`)
                    return client.logger.error(`[${server.name}] Unable to resubscribe to YouTube Channel ${channel.name}: ${err}`);
                } else {
                    return client.logger.info(`[${server.name}] Resubscribed to YouTube Channel ${channel.name}`);  
                }
            })
        })
    }
};