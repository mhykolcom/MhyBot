module.exports = {
    name: 'add',
    description: 'Add channel to live notifications.',
    args: true,
    usage: '<channel name>',
    execute(message, args, twitchChannels) {
        twitchChannels.push({name: args[0], timestamp: 0, online: false});
        message.reply("Added " + args[0] + ".");
    },
};