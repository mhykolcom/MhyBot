module.exports = {
    name: 'add',
    category: "Management",
    description: 'Add channel to monitor list.',
    aliases: ['a'],
    args: true,
    usage: '<Platform> <ChannelName> [mention]',
    permission: 'admin',
    execute(client, message, args) {
        if (args[0].toLowerCase() != "twitch" && args[0].toLowerCase() != "youtube" && args[0].toLowerCase() != "youtubeid") { return message.reply(`Please specify platform (Twitch, YouTube, or YouTubeID).`) }
        if (!args[1]) { return message.reply(`Please specify channel to monitor.`) }
        var streamer = args[1];
        const platform = args[0];
        var dmention
        if (args[2]) {
            dmention = args[2];
        } else {
            dmention = null;
        }
        var server = client.currentserver;

        if (platform.toLowerCase() == "twitch") {
            var twitchChannels = server.twitchChannels;
            var twitchMember = twitchChannels.find(channel => channel.name === streamer);
            if (twitchMember) { return message.reply(streamer + " is already in the list."); }

            client.twitchapi.users.usersByName({ users: streamer }, (err, res) => {
                if (err) return err;
                if (res) {
                    if (res.users.length > 0) {
                        twitchChannels.push({
                            name: streamer, timestamp: 0,
                            online: false, dmention
                        });
                        client.dbo.collection("servers").updateOne({ _id: client.currentserver._id }, { $push: { twitchChannels: { name: streamer.toLowerCase(), online: false, messageid: null, mention: dmention } } }, function (err, res) {
                            if (err) throw err;
                            message.reply("Twitch Channel Added: " + streamer);
                            client.logger.info(`[${server.name}] Twitch Channel Added: ${streamer}`)
                        })
                    } else {
                        message.reply(streamer + " doesn't seem to exist.");
                    }
                }
            });
        } else if (platform.toLowerCase() == "youtube" || platform.toLowerCase() == "youtubeid") {
            // Add YouTube Channel to DB
            if (!server.youtubeChannels) { var youtubeChannels = [] } else { var youtubeChannels = server.youtubeChannels; }
            var youtubeMember = ""
            client.youtube.authenticate({ type: "key", key: client.youtube.clientID });
            if (platform.toLowerCase() == "youtube") {
                youtubeMember = youtubeChannels.find(channel => channel.name === streamer);
                if (youtubeMember) { return message.reply(`${streamer} is already in the list.`) }
                client.youtube.channels.list({ "part": "snippet, contentDetails", "forUsername": `${streamer}` }, function (err, channel) {
                    if (err) { return client.logger(err) }
                    if (channel.pageInfo.totalResults == 0) { return message.reply(`${streamer} doesn't seem to exist.`); }
                    youtubeChannels.push({
                        name: streamer,
                        id: channel.items[0].id,
                        title: channel.items[0].snippet.title,
                        icon: channel.items[0].snippet.thumbnails.default.url,
                        customurl: channel.items[0].snippet.customUrl,
                        uploadPlaylist: channel.items[0].contentDetails.relatedPlaylists.uploads,
                        messageid: null,
                        mention: dmention
                    })
                    var topic = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channel.items[0].id}`
                    client.pubsub.subscribe(topic, client.pubsub.hub, function (err) {
                        if (err) {
                            message.reply(`Error subscribing to YouTube Channel: ${streamer}`)
                            return client.logger.error(`[${server.name}] Unable to subscribe to YouTube Channel ${streamer}: ${err}`);
                        }
                        client.dbo.collection("servers").updateOne({ _id: client.currentserver._id }, {
                            $push: {
                                youtubeChannels: {
                                    name: streamer,
                                    id: channel.items[0].id,
                                    title: channel.items[0].snippet.title,
                                    icon: channel.items[0].snippet.thumbnails.default.url,
                                    customurl: channel.items[0].snippet.customUrl,
                                    uploadPlaylist: channel.items[0].contentDetails.relatedPlaylists.uploads,
                                    messageid: null,
                                    mention: dmention
                                }
                            }
                        }, function (err, res) {
                            if (err) throw err;
                            message.reply("YouTube Channel Added: " + streamer);
                            client.logger.info(`[${server.name}] YouTube Channel Added: ${streamer}`)
                        })
                    })
                });
            }
            if (platform.toLowerCase() == "youtubeid") {
                youtubeMember = youtubeChannels.find(channel => channel.id === streamer);
                if (youtubeMember) { return message.reply(`${streamer} is already in the list.`) }
                client.youtube.channels.list({ "part": "snippet, contentDetails", "id": `${streamer}` }, function (err, channel) {
                    if (err) { return client.logger(err) }
                    if (channel.pageInfo.totalResults == 0) { return message.reply(`${streamer} doesn't seem to exist.`); }
                    streamer = channel.items[0].snippet.customUrl
                    youtubeChannels.push({
                        name: streamer,
                        id: channel.items[0].id,
                        title: channel.items[0].snippet.title,
                        icon: channel.items[0].snippet.thumbnails.default.url,
                        customurl: channel.items[0].snippet.customUrl,
                        uploadPlaylist: channel.items[0].contentDetails.relatedPlaylists.uploads,
                        messageid: null,
                        mention: dmention
                    })
                    var topic = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channel.items[0].id}`
                    client.pubsub.subscribe(topic, client.pubsub.hub, function (err) {
                        if (err) {
                            message.reply(`Error subscribing to YouTube Channel: ${streamer}`)
                            return client.logger.error(`[${server.name}] Unable to subscribe to YouTube Channel ${streamer}: ${err}`);
                        }
                        client.dbo.collection("servers").updateOne({ _id: client.currentserver._id }, {
                            $push: {
                                youtubeChannels: {
                                    name: streamer,
                                    id: channel.items[0].id,
                                    title: channel.items[0].snippet.title,
                                    icon: channel.items[0].snippet.thumbnails.default.url,
                                    customurl: channel.items[0].snippet.customUrl,
                                    uploadPlaylist: channel.items[0].contentDetails.relatedPlaylists.uploads,
                                    messageid: null,
                                    mention: dmention
                                }
                            }
                        }, function (err, res) {
                            if (err) throw err;
                            message.reply("YouTube Channel Added: " + streamer);
                            client.logger.info(`[${server.name}] YouTube Channel Added: ${streamer}`)
                        })
                    })
                });
            }
        }
    }
};