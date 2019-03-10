module.exports = {
    name: 'tick',
    category: "Essentials",
    description: 'Forces an update tick. Bot Owner only.',
    aliases: ['t'],
    args: false,
    usage: '',
    permission: 'botowner',
    execute(client, message, args) {
        tick();
    }
};