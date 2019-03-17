winston = require('winston')

const alignedWithColorsAndTime = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.printf((info) => {
        const {
            timestamp, level, message, ...args
        } = info;

        const ts = timestamp.slice(0, 19).replace('T', ' ');
        return `${ts} [${level}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
    }),
);

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({
            format: alignedWithColorsAndTime
        }),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

const
    fs = require('fs'),
    Discord = require('discord.js'),
    client = new Discord.Client(),
    commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')),
    channelPath = __dirname + "/channels.json",
    timeout = 4 * 60 * 1000,
    { fancyTimeFormat } = require('./utils.js');

const { discordtoken, twitchtoken, mdb_address, mdb_port } = require('./config/config.json');
client.twitchapi = require('twitch-api-v5');
var moment = require('moment');
client.servers = []
client.twitchapi.clientID = twitchtoken;
//client.twitchapi.debug = true;
client.commands = new Discord.Collection();
var MongoClient = require('mongodb').MongoClient
var MongoUrl = "mongodb://" + mdb_address + ":" + mdb_port + "/";
client.MongoClient = MongoClient
client.MongoUrl = MongoUrl


for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    // set a new item in the Collection
    // with the key as the command name and the value as the exported module
    client.commands.set(command.name, command);
}

logger.info("Connecting to Discord...");
client.on('ready', () => {
    logger.info("Logged in to Discord");
    /*logger.info("Reading file: " + channelPath);
    var file = fs.readFileSync(channelPath, { encoding: "utf-8" });
    client.servers = JSON.parse(file);*/
    tick();
    setInterval(tick, timeout);
});

client.on('message', message => {
    MongoClient.connect(MongoUrl, function(err,db){
        if (err) throw err;
        var dbo = db.db("mhybot")
        client.dbo = dbo;
        var myobj = {
            name: message.guild.name,
            id: message.guild.id,
            prefix: "~",
            role: "botadmin", 
            discordLiveChannel: "",
            discordVODChannel: "",
            twitchChannels: [] 
        }
        dbo.collection("servers").findOne({id: message.guild.id}, function(err,res){
            if (err) throw err;
            if (res.length == 0) {
                    dbo.collection("servers").insertOne(myobj,function(err, res){
                    if (err) throw err;
                    logger.info("New server added to database")
                })
                client.currentserver = myobj;
            } else {
                client.currentserver = res;
            }
            var server = client.currentserver;
            if (!message.content.startsWith(server.prefix) || message.author.bot) return;
        
            const args = message.content.slice(server.prefix.length).split(/ +/);
            const commandName = args.shift().toLowerCase();
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
                //command.execute(client, message, args);
                message.reply('commands have been disabled temporarily.');
            }
            catch (error) {
                logger.error(error);
                message.reply('there was an error trying to execute that command!');
            }
            db.close();
        })
    }) 
});

function tick() {
    try {
        MongoClient.connect(MongoUrl, function(err, db) {
            var dbo = db.db("mhybot");
            dbo.collection("servers").find().toArray(function(err, result) {
                //console.log(result[0].twitchChannels[0]);
                dbo.collection("servers");
                result.forEach((server) => {
                    try {
                        //console.log(server.twitchChannels.length);
                        client.twitchapi.users.usersByName({ users: server.twitchChannels.map(x => x.name) }, getChannelInfo.bind(this, server))
                    } catch (err) {
                        logger.error(`Error in tick: ${err}`);
                    }
                })
                db.close();
             })
        })
        logger.info("Tick happened!")
        //savechannels();
    } catch(err) {
        logger.error(`Error in tick: ${err}`)
    }
}

function getChannelInfo(server, err, res) {
    if (!res) return;
    if (err) logger.error(`Error in getChannelInfo: ${err}`);
    res.users.forEach((user) => {
        channelID = user._id;
        twitchChannelInfo = server.twitchChannels.find(name => name.name.toLowerCase() === user.name.toLowerCase())
        client.twitchapi.streams.channel({ channelID: user._id }, postDiscord.bind(this, server, twitchChannelInfo));
    })
}


function createEmbed(server, twitchChannel, res) {
    // Create the embed code
    var startDate = moment(res.stream.created_at)
    var endDate = moment.now()
    twitchChannel.uptime = moment(endDate).diff(startDate, 'seconds')
    var embed = new Discord.RichEmbed()
        .setColor("#6441A5")
        .setTitle(res.stream.channel.display_name)
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
    if (err) logger.error(`Error in postDiscord: ${err}`);
    if (server.discordLiveChannel.length == 0) return;

    if (res.stream != null && twitchChannel.messageid == null) {
        // Do new message code
        try {
            
            const guild = client.guilds.find("name", server.name);
            const discordChannel = guild.channels.find("name", server.discordLiveChannel);
            const discordEmbed = createEmbed(server, twitchChannel, res);

            discordChannel.send(discordEmbed).then(
                (message) => {
                    logger.info(`[${server.name}/${discordChannel.name}] Now Live: ${twitchChannel.name}`)
                    // Write to DB messageid
                    MongoClient.connect(MongoUrl, function(err,db) {
                        if (err) throw err;
                        var dbo = db.db("mhybot");
                        var myquery = { _id: server._id, "twitchChannels.name": twitchChannel.name }
                        var newvalues = { $set: {"twitchChannels.$.messageid": message.id, "twitchChannels.$.online": true} }
                        dbo.collection("servers").updateOne(myquery, newvalues, function(err, res){
                            if (err) throw err;
                            db.close();
                        })
                    })
                }
            );
        }
        catch (err) {
            logger.error(`Error in postDiscord new msg: ${err}`);
        }
    } else if (res.stream != null && twitchChannel.messageid != null) {
        // Do edit message code
        try {
            const guild = client.guilds.find("name", server.name);
            const discordChannel = guild.channels.find("name", server.discordLiveChannel);
            const discordEmbed = createEmbed(server, twitchChannel, res);
            
            discordChannel.fetchMessage(twitchChannel.messageid).then(
                message => message.edit(discordEmbed).then((message) => {
                    logger.info(`[${server.name}/${discordChannel.name}] Channel Update: ${twitchChannel.name}`)
                    twitchChannel.messageid = message.id
                })
            );
        } catch (err) {
            logger.error(`Error in postDiscord edit msg: ${err}`);
        }
    } else if (res.stream == null && twitchChannel.messageid != null) {
        // Do delete message code
        try {
            const guild = client.guilds.find("name", server.name);
            const discordChannel = guild.channels.find("name", server.discordLiveChannel);

            discordChannel.fetchMessage(twitchChannel.messageid).then(
                message => message.delete().then((message) => {
                    logger.info(`[${server.name}/${discordChannel.name}] Channel Offline: ${twitchChannel.name}`)
                    MongoClient.connect(MongoUrl, function(err,db) {
                        if (err) throw err;
                        var dbo = db.db("mhybot");
                        var myquery = { _id: server._id, "twitchChannels.name": twitchChannel.name }
                        var newvalues = { $set: {"twitchChannels.$.messageid": null, "twitchChannels.$.online": false} }
                        dbo.collection("servers").updateOne(myquery, newvalues, function(err, res){
                            if (err) throw err;
                            db.close();
                        })
                    })
                })
            );
        } catch (err) {
            logger.error(`Error in postDiscord delete msg: ${err}`);
        }
    }
}

function savechannels() {
    logger.info("Saving channels to " + channelPath);
    fs.writeFileSync(channelPath, JSON.stringify(client.servers, null, 4));
    logger.info("Done");
}

function exitHandler(opt, err) {
    if (err) {
        logger.error(`Error in exitHandler: ${err}`);
    }
    if (opt.save) {
        //savechannels();
    }
    if (opt.exit) {
        process.exit();
    }
}

process.on("exit", exitHandler.bind(null, { exit: true }));
process.on("SIGINT", exitHandler.bind(null, { exit: true }));
process.on("SIGTERM", exitHandler.bind(null, { exit: true }));
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

try {
    client.login(discordtoken)
} catch (err) {
    logger.error(`Error in Discord login: ${err}`);
}
