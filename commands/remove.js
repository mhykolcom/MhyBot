module.exports = {
    name: 'remove',
    category: "Management",
    description: 'Remove Twitch channel from broadcast list.',
    aliases: ['r', 'del'],
    args: true,
    usage: '<Platform> <Channel>',
    permission: "admin", // not used yet, 
    execute(client, message, args) {
        const platform = args[0];
        if (args[0].toLowerCase() != "twitch" && args[0].toLowerCase() != "youtube") { return message.reply(`Please specify platform (Twitch or YouTube).`) }
        if (!args[1]) { return message.reply(`Please specify channel to edit.`) }
        const streamer = args[1];
        var server = client.currentserver;
        if (platform == "twitch") {
            // Twitch Code
            var twitchChannels = server.twitchChannels;
            const twitchMember = twitchChannels.find(channel => channel.name.toLowerCase() === streamer.toLowerCase());
            const guild = client.guilds.find(x => x.name === server.name);
            const discordChannel = guild.channels.find(x => x.name === server.discordLiveChannel);

            if (twitchMember) {
                server.twitchChannels = twitchChannels.filter(channel => channel.name !== twitchMember.name.toLowerCase())
                client.dbo.collection("servers").findOne({ _id: client.currentserver._id }, function (err, res) {
                    // Delete message if exists
                    twitchChannelInfo = res.twitchChannels.find(name => name.name.toLowerCase() === twitchMember.name.toLowerCase())
                    if (twitchChannelInfo.messageid) {
                        // Delete message
                        discordChannel.fetchMessage(twitchChannelInfo.messageid).then(message => message.delete().then((message) => { }))

                    }
                })
                client.dbo.collection("servers").updateOne({ _id: client.currentserver._id }, { $pull: { twitchChannels: { name: twitchMember.name } } }, function (err, res) {
                    if (err) throw err;
                    message.reply("Removed Twitch Channel " + streamer + ".");
                    client.logger.info(`[${server.name}] Channel Deleted: ${twitchMember.name}`)
                })

            } else {
                message.reply(streamer + " isn't in the Twitch list.");
            }
        } else if (platform == "youtube") {
            // Youtube Code
            var youtubeChannels = server.youtubeChannels;
            const youtubeMember = youtubeChannels.find(channel => channel.name.toLowerCase() === streamer.toLowerCase());
            if (youtubeMember) {
                //
                server.youtubeChannels = youtubeChannels.filter(channel => channel.name !== youtubeMember.name.toLowerCase())
                var topic = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${youtubeMember.id}`
                client.pubsub.unsubscribe(topic, client.pubsub.hub, function (err) {
                    if (err) {
                        message.reply(`Error unsubscribing to YouTube Channel: ${streamer}`)
                        return client.logger.error(`[${server.name}] Unable to unsubscribe to YouTube Channel ${streamer}: ${err}`);
                    }

                    client.dbo.collection("servers").updateOne({ _id: client.currentserver._id }, { $pull: { youtubeChannels: { name: youtubeMember.name } } }, function (err, res) {
                        if (err) throw err;
                        message.reply("Removed YouTube Channel " + streamer + ".");
                        client.logger.info(`[${server.name}] YouTube Channel Deleted: ${youtubeMember.name}`)
                    })
                });
            } else {
                message.reply(`${streamer} isn't in the YouTube list.`)
            }

        }

    },
};