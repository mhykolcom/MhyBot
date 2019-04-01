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
        client.MongoClient.connect(client.MongoUrl, { useNewUrlParser: true }, function (err, db) {
            if (err) throw err;
            var dbo = db.db("mhybot")
            if (args[0]) { args[0] = args[0].toLowerCase(); }
            if (!server.postArchive) { server.postArchive = false; }
            if (!server.postUploads) { server.postUploads = false; }
            if (!server.postHighlights) { server.postHighlights = false; }
            if (!server.discordLiveChannel) { liveChannel = "Not Set" } else { liveChannel = server.discordLiveChannel }
            if (!server.discordVODChannel) { vodChannel = "Not Set" } else { liveChannel = server.discordVODChannel }
            var longarray = [server.prefix, server.role, server.discordLiveChannel, server.discordVODChannel, server.postArchive.toString(), server.postUploads.toString()]
            longest = longarray.reduce((a, b) => a.length > b.length ? a : b).length;
            if (!args[0]) {
                output = `= Configuration List =\n\n[Use ${server.prefix}config <option> to set that option]\n\n`
                output += `prefix         :: ${server.prefix}${" ".repeat(longest - server.prefix.length)} :: \`Your bot command prefix'\n`
                output += `role           :: ${server.role}${" ".repeat(longest - server.role.length)} :: \`Discord server role that can manage bot (No @).'\n`
                output += `livechannel    :: ${liveChannel}${" ".repeat(longest - liveChannel.length)} :: \`Discord channel to post live notifications (No #).'\n`
                output += `vodchannel     :: ${vodChannel}${" ".repeat(longest - vodChannel.length)} :: \`Discord channel to post VOD notifications (No #).'\n`
                output += `postarchive    :: ${server.postArchive}${" ".repeat(longest - server.postArchive.toString().length)} :: \`Post stream archive after going offline? A VOD channel must be set.'\n`
                output += `postuploads    :: ${server.postUploads}${" ".repeat(longest - server.postUploads.toString().length)} :: \`Post latest VOD uploads? A VOD channel must be set.'\n`
                output += `posthighlights :: ${server.postHighlights}${" ".repeat(longest - server.postHighlights.toString().length)} :: \`Post channel highlights? A VOD channel must be set.'`
                return message.channel.send(output, { code: "asciidoc" });
            }
            switch (args[0]) {
                case "prefix":
                    if (!args[1]) {
                        return message.reply("Please specify an argument");
                    } else {
                        server.prefix = args[1];
                        dbo.collection("servers").updateOne({ _id: server._id }, { $set: { prefix: server.prefix } }, function (err) { if (err) return err; })
                        return message.reply(`Changed prefix to \`${server.prefix}\``);
                    }
                case "role":
                    if (!args[1]) {
                        return message.reply("Please specify an argument");
                    } else {
                        server.role = args[1];
                        if (server.role.includes('@')) {
                            return message.reply(`Do not use @role, just type the role name`)
                        }
                        dbo.collection("servers").updateOne({ _id: server._id }, { $set: { role: server.role } }, function (err) { if (err) return err; })
                        return message.reply(`Changed role to \`${server.role}\``);
                    }
                case "livechannel":
                    if (!args[1]) {
                        server.discordLiveChannel = '';
                    } else {
                        server.discordLiveChannel = args[1];
                        if (server.discordLiveChannel.includes('#')) {
                            return message.reply(`Do not use #channel, just type the channel name`)
                        }
                    }
                    dbo.collection("servers").updateOne({ _id: server._id }, { $set: { discordLiveChannel: server.discordLiveChannel } }, function (err) { if (err) return err; })
                    return message.reply(`Live announcing channel set to \`${args[1]}\``)

                case "vodchannel":
                    if (!args[1]) {
                        server.discordVODChannel = '';
                    } else {
                        server.discordVODChannel = args[1];
                        if (server.discordVODChannel.includes('#')) {
                            return message.reply(`Do not use #channel, just type the channel name`)
                        }
                    }

                    dbo.collection("servers").updateOne({ _id: server._id }, { $set: { discordVODChannel: server.discordVODChannel } }, function (err) { if (err) return err; })
                    return message.reply(`VOD announcing channel set to \`${args[1]}\``)

                case "postarchive":
                    if (args[1].toLowerCase() != "true" && args[1].toLowerCase() != "false") {
                        return message.reply("Must be either TRUE or FALSE")
                    } else {
                        try {
                            if (args[1].toLowerCase() == "true") {
                                server.postArchive = true;
                            } else if (args[1].toLowerCase() == "false") {
                                server.postArchive = false;
                            }
                            dbo.collection("servers").updateOne({ _id: server._id }, { $set: { postArchive: server.postArchive } }, function (err) { if (err) return err; })
                            return message.reply(`PostArchive set to \`${args[1]}\``)
                        } catch (err) {
                            logger.error(`[${server.name}] Failed to set PostArchive: ${args[1]} | ${err}`)
                            return message.reply(`Failed to set PostArchive`)
                        }
                    }
                case "postuploads":
                    if (args[1].toLowerCase() != "true" && args[1].toLowerCase() != "false") {
                        return message.reply("Must be either TRUE or FALSE")
                    } else {
                        try {
                            if (args[1].toLowerCase() == "true") {
                                server.postUploads = true;
                            } else if (args[1].toLowerCase() == "false") {
                                server.postUploads = false;
                            }
                            dbo.collection("servers").updateOne({ _id: server._id }, { $set: { postUploads: server.postUploads } }, function (err) { if (err) return err; })
                            return message.reply(`PostUploads set to \`${args[1]}\``)
                        } catch (err) {
                            logger.error(`[${server.name}] Failed to set PostUploads: ${args[1]} | ${err}`)
                            return message.reply(`Failed to set PostUploads`)
                        }
                    }
                case "posthighlights":
                    if (args[1].toLowerCase() != "true" && args[1].toLowerCase() != "false") {
                        return message.reply("Must be either TRUE or FALSE")
                    } else {
                        try {
                            if (args[1].toLowerCase() == "true") {
                                server.postHighlights = true;
                            } else if (args[1].toLowerCase() == "false") {
                                server.postHighlights = false;
                            }
                            dbo.collection("servers").updateOne({ _id: server._id }, { $set: { postHighlights: server.postHighlights } }, function (err) { if (err) return err; })
                            return message.reply(`PostHighlights set to \`${args[1]}\``)
                        } catch (err) {
                            logger.error(`[${server.name}] Failed to set PostHighlights: ${args[1]} | ${err}`)
                            return message.reply(`Failed to set PostHighlights`)
                        }
                    }
            }
            db.close();
        })
    }

};