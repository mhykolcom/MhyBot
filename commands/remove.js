module.exports = {
    name: 'remove',
    category: "Twitch",
    description: 'Remove Twitch channel from broadcast list.',
    aliases: ['r','del'],
    args: true,
    usage: '<TwitchChannel>',
    permission: "admin", // not used yet, 
    execute(client, message, args) {
        const streamer = args[0];
        //var server = client.servers.find(server => server.name === message.guild.name);
        var server = client.currentserver;
        var twitchChannels = server.twitchChannels;
        const twitchMember = twitchChannels.find(channel => channel.name.toLowerCase() === streamer.toLowerCase());

        if (twitchMember) {
            server.twitchChannels = twitchChannels.filter(channel => channel.name !== twitchMember.name)
            client.MongoClient.connect(client.MongoUrl, function (err, db) {
                if (err) throw err;
                var dbo = db.db("mhybot")
                dbo.collection("servers").updateOne({ _id: currentserver._id, "twitchChannels.name": twitchChannel.name }, { $unset: { "twitchChannels.$": "" } }, function (err, res) {
                    if (err) throw err;
                    message.reply("Removed " + streamer + ".");
                })

            })

        } else {
            message.reply(streamer + " isn't in the list.");
        }

    },
};