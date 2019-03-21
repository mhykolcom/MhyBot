module.exports = {
    name: 'add',
    category: "Management",
    description: 'Add Twitch channel to broadcast list.',
    aliases: ['a'],
    args: true,
    usage: '<TwitchChannel> [mention]',
    permission: 'admin',
    execute(client, message, args) {
        const streamer = args[0];
        var dmention
        //var server = client.servers.find(server => server.name === message.guild.name);
        var server = client.currentserver;
        var twitchChannels = server.twitchChannels;
        var twitchMember = twitchChannels.find(channel => channel.name === streamer);

        if (args[1]) {
            dmention = args[1];
        } else {
            dmention = null;
        }

        if (twitchMember)
            return message.reply(streamer + " is already in the list.");

        client.twitchapi.users.usersByName({ users: streamer }, (err, res) => {
            //if (!res) { return message.reply("API error finding user, rate limited: " + streamer) }
            if (err) return err;

            if (res) {
                if (res.users.length > 0) {
                    twitchChannels.push({
                        name: streamer, timestamp: 0,
                        online: false, dmention
                    });
                    client.MongoClient.connect(client.MongoUrl, function (err, db) {
                        if (err) throw err;
                        var dbo = db.db("mhybot")
                        dbo.collection("servers").updateOne({ _id: client.currentserver._id }, { $push: { twitchChannels: { name: streamer, online: false, messageid: null, mention: dmention } } }, function (err, res) {
                            if (err) throw err;
                            message.reply("Added " + streamer + ".");
                            client.logger.info(`[${server.name}] Channel Added: ${streamer}`)
                        })
                        db.close();
                    })
                } else {
                    message.reply(streamer + " doesn't seem to exist.");
                }
            }
        });
    }
};