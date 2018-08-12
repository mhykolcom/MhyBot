winston = require('winston')
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log` 
        // - Write all logs error (and below) to `error.log`.
        //
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});
const
    fs = require('fs'),
    Discord = require('discord.js'),
    client = new Discord.Client(),
    commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')),
    channelPath = __dirname + "/channels.json",
    timeout = 4 * 60 * 1000,
    { print, fancyTimeFormat } = require('./utils.js');

const { discordtoken, twitchtoken } = require('./config/config.json');
client.twitchapi = require('twitch-api-v5');
var moment = require('moment');
client.twitchapi.clientID = twitchtoken;
//client.twitchapi.debug = true;
client.commands = new Discord.Collection();

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    // set a new item in the Collection
    // with the key as the command name and the value as the exported module
    client.commands.set(command.name, command);
}


client.on('ready', () => {
    print("Logged in to Discord");
    print("Reading file: " + channelPath);
    var file = fs.readFileSync(channelPath, { encoding: "utf-8" });
    client.servers = JSON.parse(file);

    // Tick twice at startup for weird bug reason
    tick();
    //setTimeout(tick, 10000);
    setInterval(tick, timeout);
});

client.on('message', message => {
    let index = indexOfObjectByName(client.servers, message.guild.name);
    var server = client.servers[index];

    if (!message.content.startsWith(server.prefix) || message.author.bot) return;

    const args = message.content.slice(server.prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (index == -1) {
        client.servers.push({
            name: message.guild.name,
            lastPrefix: "!", prefix: "~",
            role: "botadmin", discordChannels: [],
            twitchChannels: []
        });
        index = client.servers.length - 1;
    }

    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    let permissions = ['user'];

    if (message.member.roles.exists("name", server.role)) {
        permissions.push('admin');
    }

    if (message.guild.owner == message.member) {
        permissions.push('admin');
        permissions.push('owner');
    }

    if (message.member.id == "83002230331932672") {
        permissions.push('admin');
        permissions.push('owner');
        permissions.push('botowner');
    }

    if (command.permission && !(permissions.indexOf(command.permission) > -1)) {
        // user not allowed...
        message.reply(`You do not have the required permission \`${command.permission}\` to run this command.`);
        return;
    }

    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, ${message.author}!`;
        if (command.usage) {
            reply += `\nThe proper usage would be: \`${server.prefix}${command.name} ${command.usage}\``;
        }
        return message.channel.send(reply);
    }

    try {
        command.execute(client, message, args);
    }
    catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
});

function indexOfObjectByName(array, value) {
    for (let i = 0; i < array.length; i++) {
        if (array[i].name.toLowerCase().trim() === value.toLowerCase().trim()) {
            return i;
        }
    }
    return -1;
}

function tick() {
    client.servers.forEach((server) => {
        try {
            client.twitchapi.users.usersByName({ users: server.twitchChannels.map(x => x.name) }, getChannelInfo.bind(this, server))
        } catch (err) {
            print(err);
        }
    })
    savechannels();
    print("Tick happened!")
}

function getChannelInfo(server, err, res) {
    if (!res) return;

    res.users.forEach((user) => {
        channelID = user._id;
        twitchChannel = server.twitchChannels.find(name => name.name.toLowerCase() === user.name.toLowerCase())
        client.twitchapi.streams.channel({ channelID: user._id }, postDiscord.bind(this, server, twitchChannel));
    })
}


function createEmbed(server, twitchChannel, res) {
    // Create the embed code
    var startDate = moment(res.stream.created_at)
    var endDate = moment.now()
    twitchChannel.uptime = moment(endDate).diff(startDate, 'seconds')
    var embed = new Discord.RichEmbed()
        .setColor("#6441A5")
        .setTitle(res.stream.channel.display_name.replace(/_/g, "\\_"))
        .setURL(res.stream.channel.url)
        .setDescription("**" + res.stream.channel.status +
            "**\n" + res.stream.game)
        //.setImage(res.stream.preview.large)
        .setThumbnail(res.stream.channel.logo)
        .addField("Viewers", res.stream.viewers, true)
        .addField("Uptime", fancyTimeFormat(twitchChannel.uptime), true);
    return embed;
}


function postDiscord(server, twitchChannel, err, res) {
    if (!res) return;
    if (server.discordChannels.length == 0) return;

    if (res.stream != null && twitchChannel.messageid == null) {
        // Do new message code
        try {
            const guild = client.guilds.find("name", server.name);
            const discordChannel = guild.channels.find("name", server.discordChannels[0]);
            const discordEmbed = createEmbed(server, twitchChannel, res);

            discordChannel.send(discordEmbed).then(
                (message) => {
                    print(`[${server.name}/${discordChannel.name}] Now Live: ${twitchChannel.name}`)
                    twitchChannel.messageid = message.id
                }
            );
            twitchChannel.online = true;
            twitchChannel.timestamp = Date.now();
        }
        catch (err) {
            print(err);
        }
    } else if (res.stream != null && twitchChannel.messageid != null) {
        // Do edit message code
        try {
            const guild = client.guilds.find("name", server.name);
            const discordChannel = guild.channels.find("name", server.discordChannels[0]);
            const discordEmbed = createEmbed(server, twitchChannel, res);

            discordChannel.fetchMessage(twitchChannel.messageid).then(
                message => message.edit(discordEmbed).then((message) => {
                    print(`[${server.name}/${discordChannel.name}] Channel Update: ${twitchChannel.name}`)
                    twitchChannel.messageid = message.id
                })
            );
            twitchChannel.online = true;
            twitchChannel.timestamp = Date.now();
        } catch (err) {
            print(err);
        }
    } else if (res.stream == null && twitchChannel.messageid != null) {
        // Do delete message code
        try {
            const guild = client.guilds.find("name", server.name);
            const discordChannel = guild.channels.find("name", server.discordChannels[0]);
            const discordEmbed = createEmbed(server, twitchChannel, res);

            discordChannel.fetchMessage(twitchChannel.messageid).then(
                message => message.delete().then((message) => {
                    print(`[${server.name}/${discordChannel.name}] Channel Offline: ${twitchChannel.name}`)
                    twitchChannel.messageid = null
                })
            );
            twitchChannel.online = false;
        } catch (err) {
            print(err);
        }
    }
}

function savechannels() {
    print("Saving channels to " + channelPath);
    fs.writeFileSync(channelPath, JSON.stringify(client.servers, null, 4));
    print("Done");
}

function exitHandler(opt, err) {
    if (err) {
        print(err);
    }
    if (opt.save) {
        savechannels();
    }
    if (opt.exit) {
        process.exit();
    }
}

process.on("exit", exitHandler.bind(null, { save: true }));
process.on("SIGINT", exitHandler.bind(null, { exit: true }));
process.on("SIGTERM", exitHandler.bind(null, { exit: true }));
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

try {
    client.login(discordtoken)
} catch (error) {
    print(error);
}
