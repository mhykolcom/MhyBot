module.exports = {
    name: 'leave',
    category: "Management",
    description: 'Tells the bot to leave your server.',
    aliases: [],
    args: false,
    usage: '',
    allowNoSubcommand: true,
    permission: 'owner',
    execute(client, message, args) {
        var response
        if (!args[0]) { response = " " } else { response = args[0] }
        if (response.toLowerCase() != "confirm") {
            message.reply(`**WARNING: All data for your server will be removed from the bot, and will be unrecoverable!** Please type \`${server.prefix}leave confirm\` to confirm you want the bot to leave.`)
        } else if (response.toLowerCase() == "confirm") {
            message.reply(`I'll miss you, good bye :'(`)

        }
    }
}
