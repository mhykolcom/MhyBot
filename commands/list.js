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

        // Alphabetize list
        twitchChannels.sort(function(a, b){ return a.name > b.name});
        
        let msg = "\n";
        for (let i = 0; i < twitchChannels.length; i++) {
            if (twitchChannels[i].online) {
                msg += `🔴 ${twitchChannels[i].name}\n`;
            } else {
                msg += `⚫ ${twitchChannels[i].name}\n`;
            }
        }
        if (!msg) {
            message.reply("The list is empty.");
        } else {
            message.reply("Streamer list:" + msg.replace(/_/g, "\\_"));
        }
    },
};