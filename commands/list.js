module.exports = {
    name: 'list',
    category: "Essentials",
    description: 'List Twitch channels in the broadcast list.',
    aliases: [],
    args: false,
    usage: '',
    permission: "admin",
    execute(client, message, args) {
        // needs twitchChannels in here too!
        var server = client.currentserver;
        var twitchChannels = server.twitchChannels;
        var youtubeChannels = server.youtubeChannels;

        // Alphabetize list
        twitchChannels.sort(function (a, b) { return a.name.toLowerCase() > b.name.toLowerCase() });
        youtubeChannels.sort(function (a, b) { return a.name.toLowerCase() > b.name.toLowerCase() });

        let msg = "\n";
        for (let i = 0; i < twitchChannels.length; i++) {
            if (twitchChannels[i].online) {
                msg += `🔴 ${twitchChannels[i].display_name}\n`;
            } else {
                msg += `⚫ ${twitchChannels[i].display_name}\n`;
            }
        }
        if (!msg) {
            message.reply("Twitch list is empty.");
        } else {
            message.reply("Twitch Streamer list:" + msg.replace(/_/g, "\\_"));
        }

        let ytmsg = "\n";
        for (let i = 0; i < youtubeChannels.length; i++) {
            ytmsg += `🔔 ${youtubeChannels[i].name}\n`;
        }
        if (!ytmsg) {
            message.reply("Youtube list is empty.");
        } else {
            message.reply("Youtube Creator list:" + ytmsg.replace(/_/g, "\\_"));
        }

    },
};