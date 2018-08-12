module.exports = {
    name: 'help',
    description: 'List all of my commands or info about a specific command.',
    aliases: ['commands'],
    args: true,
    usage: '[command name]',
    permission: "user", 
    execute(client, message, args) {
        // If no specific command is called, show all filtered commands.
        if (!args[0]) {
            // get server settings
            var server = client.servers.find(server => server.name === message.guild.name);

            // Filter all commands by which are available for the user's level, using the <Collection>.filter() method.
            const myCommands = client.commands;

            // Here we have to get the command names only, and we use that array to get the longest name.
            // This make the help commands "aligned" in the output.
            const commandNames = myCommands.keyArray();
            const longest = commandNames.reduce((long, str) => Math.max(long, str.length), 0);

            let currentCategory = "";
            let output = `= Command List =\n\n[Use ${server.prefix}help <commandname> for details]\n`;
            const sorted = myCommands.array().sort((p, c) => p.category > c.category ? 1 : p.name > c.name && p.category === c.category ? 1 : -1);

            sorted.forEach(c => {
                const cat = c.category.toProperCase();
                if (currentCategory !== cat) {
                    output += `\u200b\n== ${cat} ==\n`;
                    currentCategory = cat;
                }
                output += `${message.settings.prefix}${c.name}${" ".repeat(longest - c.name.length)} :: ${c.description}\n`;
            });
            message.channel.send(output, { code: "asciidoc", split: { char: "\u200b" } });
        } else {
            // Show individual command's help.
            let command = args[0];
            if (client.commands.has(command)) {
                command = client.commands.get(command);
                if (level < client.levelCache[command.conf.permLevel]) return;
                message.channel.send(`= ${command.name} = \n${command.description}\nusage:: ${command.usage}\naliases:: ${command.aliases.join(", ")}\n= ${command.name} =`, { code: "asciidoc" });
            }
        }

    }
};