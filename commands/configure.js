module.exports = {
    name: 'configure',
    category: "Management",
    description: 'Configure the bot for your server. Server Owner only.',
    aliases: ['config'],
    args: false,
    usage: '<setting> <value>',
    permission: 'owner',
    execute(client, message, args) {
        //var server = client.servers.find(server => server.name === message.guild.name);
        var server = client.currentserver;
        var twitchChannels = server.twitchChannels;
        client.MongoClient.connect(client.MongoUrl, function (err, db) {
            if (err) throw err;
            var dbo = db.db("mhybot")
            if (!args[0]) {
                output = `prefix:        ${server.prefix}\nrole:          ${server.role}\nlive channel:  ${server.discordLiveChannel}\nvod channel:   ${server.discordVODChannel}`
                return message.channel.send(output, { code: "asciidoc" });
            } else if (args[0] == "prefix") {
                if (!args[1]) {
                    return message.reply("Please specify an argument");
                } else {
                    server.prefix = args[1];
                    dbo.collection("servers").updateOne({ _id: server._id }, { $set: { prefix: server.prefix }}, function (err) { if (err) return err; })
                    return message.reply(`Changed prefix to \`${server.prefix}\``);
                }
            } else if (args[0] == "role") {
                if (!args[1]) {
                    return message.reply("Please specify an argument");
                } else {
                    server.role = args[1];
                    dbo.collection("servers").updateOne({ _id: server._id }, { $set: { role: server.role }}, function (err) { if (err) return err; })
                    return message.reply(`Changed role to \`${server.role}\``);
                }

            } else if (args[0] == "livechannel") {
                if (!args[1]) {
                    return message.reply("Please specify an argument");
                } else {
                    server.discordLiveChannel = args[1];
                    dbo.collection("servers").updateOne({ _id: server._id }, { $set: { discordLiveChannel: server.discordLiveChannel }}, function (err) { if (err) return err; })
                    return message.reply(`Live announcing channel set to \`${args[1]}\``)
                }
            } else if (args[0] == "vodchannel") {
                if (!args[1]) {
                    return message.reply("Please specify an argument");
                } else {
                    server.discordVODChannel = args[1];
                    dbo.collection("servers").updateOne({ _id: server._id }, { $set: { discordVODChannel: server.discordVODChannel }}, function (err) { if (err) return err; })
                    return message.reply(`Vod announcing channel set to \`${args[1]}\``)
                }
            }
            db.close();
        })
    }

};