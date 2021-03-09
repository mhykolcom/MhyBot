const { print } = require('../utils.js');

module.exports = {
    name: 'clear',
    category: "Management",
    description: 'Clear specified number of message from chat.',
    aliases: ['prune'],
    args: true,
    usage: '<number>',
    allowNoSubcommand: false,
    permission: 'admin',
    execute(client, message, args) {
        const amount = parseInt(args[0]) + 1;

        if (isNaN(amount)) {
            return message.reply('that doesn\'t seem to be a valid number.');
        }
        else if (amount <= 1 || amount > 100) {
            return message.reply('you need to input a number between 1 and 99.');
        }
        message.channel.bulkDelete(amount, true).catch(err => {
            message.channel.send('there was an error trying to prune messages in this channel!');
        });
    }
};
