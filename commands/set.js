module.exports = {
    name: 'set',
    category: "Management",
    description: 'Set a different mention for a channel.',
    aliases: ['s', 'edit'],
    args: true,
    usage: '<Platform> <ChannelName> [mention]',
    permission: 'admin',
    execute(client, message, args) {
        const platform = args[0];
        if (args[0].toLowerCase() != "twitch" && args[0].toLowerCase() != "youtube") { return message.reply(`Please specify platform (Twitch or YouTube).`) }
        if (!args[1]) { return message.reply(`Please specify channel to edit.`) }
        const streamer = args[1];
        var server = client.currentserver;
        if (args[2]) {
            dmention = args[2];
        } else {
            dmention = null;
        }
        if (platform == "twitch") {
            // Twitch code
            var twitchChannels = server.twitchChannels;
            var twitchMember = twitchChannels.find(channel => channel.name === streamer.toLowerCase());
            if (!twitchMember) { return message.reply(streamer + " does not exist - use the add command."); }
            dbsearch = { _id: client.currentserver._id, "twitchChannels.name": twitchMember.name.toLowerCase() }
            dbupdate = { $set: { "twitchChannels.$.mention": dmention } }

        } else if (platform == "youtube") {
            // Youtube code
            var youtubeChannels = server.youtubeChannels;
            var youtubeMember = youtubeChannels.find(channel => channel.name === streamer.toLowerCase());
            if (!youtubeMember) { return message.reply(`${streamer} does not exist - use the add command.`) }
            dbsearch = { _id: client.currentserver._id, "youtubeChannels.name": twitchMember.name.toLowerCase() }
            dbupdate = { $set: { "youtubeChannels.$.mention": dmention } }

        }
        client.MongoClient.connect(client.MongoUrl, { useNewUrlParser: true }, function (err, db) {
            if (err) throw err;
            var dbo = db.db("mhybot")
            dbo.collection("servers").updateOne(dbsearch, dbupdate, function (err, res) {
                if (err) throw err;
                message.reply("Edited " + streamer + ".");
                client.logger.info(`[${server.name}] Channel Edited: ${streamer}`)
            })
            db.close();
        })
    }
}