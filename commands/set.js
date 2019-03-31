module.exports = {
    name: 'set',
    category: "Management",
    description: 'Set a different mention for a Twitch channel.',
    aliases: ['s', 'edit'],
    args: true,
    usage: '<TwitchChannel> [mention]',
    permission: 'admin',
    execute(client, message, args) {
        const streamer = args[0];
        //var server = client.servers.find(server => server.name === message.guild.name);
        var server = client.currentserver;
        var twitchChannels = server.twitchChannels;
        var twitchMember = twitchChannels.find(channel => channel.name === streamer.toLowerCase());
        if (args[1]) {
            dmention = args[1];
        } else {
            dmention = null;
        }

        if (!twitchMember) { return message.reply(streamer + " does not exist - use the add command."); }

        client.MongoClient.connect(client.MongoUrl, { useNewUrlParser: true }, function (err, db) {
            if (err) throw err;
            var dbo = db.db("mhybot")
            dbo.collection("servers").updateOne({ _id: client.currentserver._id, "twitchChannels.name": twitchMember.name.toLowerCase() }, { $set: { "twitchChannels.$.mention": dmention } }, function (err, res) {
                if (err) throw err;
                message.reply("Edited " + streamer + ".");
                client.logger.info(`[${server.name}] Channel Edited: ${streamer}`)
            })
            db.close();
        })
    }
}