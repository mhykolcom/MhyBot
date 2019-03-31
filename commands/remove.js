module.exports = {
    name: 'remove',
    category: "Management",
    description: 'Remove Twitch channel from broadcast list.',
    aliases: ['r', 'del'],
    args: true,
    usage: '<TwitchChannel>',
    permission: "admin", // not used yet, 
    execute(client, message, args) {
        const streamer = args[0];
        //var server = client.servers.find(server => server.name === message.guild.name);
        var server = client.currentserver;
        var twitchChannels = server.twitchChannels;
        const twitchMember = twitchChannels.find(channel => channel.name.toLowerCase() === streamer.toLowerCase());
        const guild = client.guilds.find(x => x.name === server.name);
        const discordChannel = guild.channels.find(x => x.name === server.discordLiveChannel);

        if (twitchMember) {
            server.twitchChannels = twitchChannels.filter(channel => channel.name !== twitchMember.name)
            client.MongoClient.connect(client.MongoUrl,{ useNewUrlParser: true }, function (err, db) {
                if (err) throw err;
                var dbo = db.db("mhybot")
                dbo.collection("servers").findOne({ _id: client.currentserver._id }, function (err, res) {
                    // Delete message if exists
                    twitchChannelInfo = res.twitchChannels.find(name => name.name.toLowerCase() === twitchMember.name.toLowerCase())
                    if (twitchChannelInfo.messageid) {
                        // Delete message
                        discordChannel.fetchMessage(twitchChannelInfo.messageid).then(message => message.delete().then((message) => { }))

                    }
                })
                dbo.collection("servers").updateOne({ _id: client.currentserver._id }, { $pull: { twitchChannels: { name: twitchMember.name } } }, function (err, res) {
                    if (err) throw err;
                    message.reply("Removed " + streamer + ".");
                    client.logger.info(`[${server.name}] Channel Deleted: ${twitchMember.name}`)
                })
                db.close()
            })

        } else {
            message.reply(streamer + " isn't in the list.");
        }

    },
};