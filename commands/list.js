module.exports = {
    name: 'list',
    description: 'List Twitch channels in the broadcast list.',
    args: false,
    usage: '',
    permission: "user", // not used yet, 
    execute(client, message, args) {
        // needs twitchChannels in here too!
        var server = client.servers.find(server => server.name === message.guild.name);
        var twitchChannels = server.twitchChannels;
        
        let msg = "\n";
        for (let i = 0; i < twitchChannels.length; i++) {
            var streamStatus;
            if (twitchChannels[i].online) {
                msg += "**" + twitchChannels[i].name + " online**\n";
            } else {
                streamStatus = "offline";
                msg += twitchChannels[i].name + " offline\n";
            }
        }
        if (!msg) {
            message.reply("The list is empty.");
        } else {
            message.reply(msg.replace(/_/g, "\\_"));
        }
    },
};