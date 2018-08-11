module.exports = {
    name: 'configure',
    description: 'Add Twitch channel from broadcast list.',
    args: true,
    usage: '<TwitchChannel>',
    permission: 'owner',
    execute(client, message, args) {
        var server = client.servers.find(server => server.name === message.guild.name);
        var twitchChannels = server.twitchChannels;

        let msg = "";
        if (message.content.substring(11, 15) == "list") {
            msg += "```\n" +
                "prefix    " + server.prefix + "\n" +
                "role      " + server.role + "\n";

            msg += "channels  " + server.discordChannels[0];
            if (server.discordChannels.length > 1) {
                msg += ",";
            }
            msg += "\n";

            for (let i = 1; i < server.discordChannels.length; i++) {
                msg += "          " + server.discordChannels[i];
                if (i != server.discordChannels.length - 1) {
                    msg += ",";
                }
                msg += "\n";
            }
            msg += "```";

        } else if (message.content.substring(11, 17) == "prefix") {
            let newPrefix = message.content.substring(18, 19);
            if (newPrefix.replace(/\s/g, '').length === 0) {
                msg += "Please specify an argument";
            } else if (newPrefix == server.prefix) {
                msg += "Prefix already is " + server.prefix;
            } else {
                server.lastPrefix = server.prefix;
                server.prefix = newPrefix;
                msg += "Changed prefix to " + server.prefix;
            }

        } else if (message.content.substring(11, 15) == "role") {
            if (message.content.substring(16).replace(/\s/g, '').length === 0) {
                msg += "Please specify an argument";
            } else {
                server.role = message.content.substring(16);
                msg += "Changed role to " + server.role;
            }

        } else if (message.content.substring(11, 18) == "channel") {
            if (message.content.substring(19, 22) == "add") {
                let channel = message.content.substring(23);
                if (channel.replace(/\s/g, '').length === 0) {
                    msg += "Please specify an argument";
                } else if (message.guild.channels.exists("name", channel)) {
                    server.discordChannels.push(channel);
                    msg += "Added " + channel + " to list of channels to post in.";
                } else {
                    msg += channel + " does not exist on this server.";
                }

            } else if (message.content.substring(19, 25) == "remove") {
                for (let i = server.discordChannels.length; i >= 0; i--) {
                    let channel = message.content.substring(26);
                    if (channel.replace(/\s/g, '').length === 0) {
                        msg = "Please specify an argument";
                        break;
                    } else if (server.discordChannels[i] == channel) {
                        server.discordChannels.splice(i, 1);
                        msg = "Removed " + channel + " from list of channels to post in.";
                        break;
                    } else {
                        msg = channel + " does not exist in list.";
                    }
                }
            } else {
                msg = "Please specify an argument for channel";
            }

        } else {
            msg += "```\n" +
                "Usage: " + server.prefix + "configure OPTION [SUBOPTION] VALUE\n" +
                "Example: " + server.prefix + "configure channel add example\n" +
                "\nOptions:\n" +
                "  list        List current config\n" +
                "  prefix      Character to use in front of commands\n" +
                "  role        Role permitting usage of add and remove\n" +
                "  channel     Channel(s) to post in, empty list will use the first channel\n" +
                "      add         Add a discord channel to the list\n" +
                "      remove      Remove a discord channel from the list\n" +
                "```";
        }
        message.reply(msg);
    }
};