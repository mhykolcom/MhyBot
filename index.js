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
    YouTube = require('youtube-api'),
    client = new Discord.Client(),
    commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')),
    timeout = 4 * 60 * 1000,
    { fancyTimeFormat, fancyDurationFormat } = require('./utils.js');

const { discordtoken, twitchtoken, youtubetoken, mdb_address, mdb_port } = require('./config/config.json');
client.twitchapi = require('twitch-api-v5');
client.youtube = YouTube;
client.youtube.clientID = youtubetoken;
var moment = require('moment');
client.servers = []
client.twitchapi.clientID = twitchtoken;
//client.twitchapi.debug = true;
client.commands = new Discord.Collection();
var MongoClient = require('mongodb').MongoClient
var MongoUrl = "mongodb://" + mdb_address + ":" + mdb_port + "/";
client.MongoClient = MongoClient
client.MongoUrl = MongoUrl
client.logger = logger
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

logger.info("Connecting to Discord...");
client.on('ready', () => {
    logger.info("Logged in to Discord");
    tick();
    setInterval(tick, timeout);
});

client.on('message', message => {
    MongoClient.connect(MongoUrl, { useNewUrlParser: true }, function (err, db) {
        if (err) throw err;
        var dbo = db.db("mhybot")
        client.dbo = dbo;
        var myobj = {
            name: message.guild.name,
            id: message.guild.id,
            prefix: "~",
            role: "botadmin",
            discordLiveChannel: null,
            discordVODChannel: null,
            postarchive: null,
            twitchChannels: [],
            youtubeChannels: []
        }
        dbo.collection("servers").findOne({ id: message.guild.id }, function (err, res) {
            if (err) throw err;
            if (!res) {
                dbo.collection("servers").insertOne(myobj, function (err, res) {
                    if (err) throw err;
                    logger.info(`[${message.guild.name}] New server added to database`)
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
            if (message.member.roles.some(x => x.name === server.role)) {
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
                //message.reply('commands have been disabled temporarily.');
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
        MongoClient.connect(MongoUrl, { useNewUrlParser: true }, function (err, db) {
            var dbo = db.db("mhybot");
            dbo.collection("servers").find().toArray(function (err, result) {
                dbo.collection("servers");
                result.forEach((server) => {
                    try {
                        //console.log(server.twitchChannels.map(x => x.name))
                        client.twitchapi.users.usersByName({ users: server.twitchChannels.map(x => x.name) }, getChannelInfo.bind(this, server))
                        if (server.youtubeChannels) {
                            server.youtubeChannels.forEach((ytChannel) => postYT(server, ytChannel))
                        }
                    } catch (err) {
                        logger.error(`Error in tick: ${err}`);
                    }

                })
                db.close();
            })
        })
        logger.info("Tick happened!")
    } catch (err) {
        logger.error(`Error in tick: ${err}`)
    }
}

// Twitch Functions

function getChannelInfo(server, err, res) {
    if (!res) return;
    //console.log(res);
    if (err) logger.error(`Error in getChannelInfo: ${err}`);
    //console.log(res.users)
    res.users.forEach((user) => {
        twitchChannelInfo = server.twitchChannels.find(name => name.name.toLowerCase() === user.name.toLowerCase())
        try {
            MongoClient.connect(MongoUrl, { useNewUrlParser: true }, function (err, db) {
                var dbo = db.db("mhybot");
                twitchChannelDB = server.twitchChannels.find(name => name.name.toLowerCase() === user.name.toLowerCase())
                var myquery = { _id: server._id, "twitchChannels.name": twitchChannelDB.name }
                var newvalues = { $set: { "twitchChannels.$.id": user._id, "twitchChannels.$.display_name": user.display_name, "twitchChannels.$.name": user.name.toLowerCase() } }
                dbo.collection("servers").updateOne(myquery, newvalues, function (err, res) {
                    if (err) throw err;
                });
            });
        } catch (err) {
            console.log(`Error in user database update: ${err}`)
        }
        client.twitchapi.streams.channel({ channelID: user._id }, postDiscord.bind(this, server, twitchChannelInfo));
        if (!server.postUploads) { server.postUploads = false }
        if (server.postUploads == true) {
            client.twitchapi.channels.videos({ channelID: user._id, broadcast_type: "upload", limit: "1" }, postVOD.bind(this, server, twitchChannelInfo, "upload"));
        }
        if (!server.postHighlights) { server.postHighlights = false }
        if (server.postHighlights == true) {
            client.twitchapi.channels.videos({ channelID: user._id, broadcast_type: "highlight", limit: "4" }, postVOD.bind(this, server, twitchChannelInfo, "highlight"));
        }
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
        .addField("Uptime", fancyTimeFormat(twitchChannel.uptime), true)
        .setFooter("Last updated")
        .setTimestamp()
    return embed;
}

function createVODEmbed(server, twitchChannel, res) {
    try {
        // Create the embed code
        vod = res
        //console.log(vod)
        // Limit description to 200 characters
        if (!vod.description) { vod.description = "" }
        if (!vod.game) { vod.game = "Unknown" }
        if (!vod.length) { vod.length = "Unknown" }
        if (vod.description.length > 199) {
            vod.description = vod.description.substring(0, 199) + "[...]"
        }
        var embed = new Discord.RichEmbed()
            .setColor("#6441A5")
            .setTitle(vod.title)
            .setURL(vod.url)
            .setDescription("**" + vod.channel.display_name + "**\n" + vod.description.replace("/n/n", ""))
            .setImage(vod.preview.large)
            .addField("Game", vod.game, true)
            .addField("Length", fancyDurationFormat(vod.length), true)
            .addField("Type", vod.broadcast_type.charAt(0).toUpperCase() + vod.broadcast_type.slice(1), true)
            .setFooter("Posted on: " + vod.published_at)
        return embed;
    } catch (err) {
        console.log(vod);
        logger.error(`Error in createVODEmbed: ${err} | ${twitchChannel.name} | ${server.name}`);
    }
}

function postVOD(server, twitchChannel, type, err, res) {
    if (!res) return;
    if (!server.discordVODChannel) return;
    if (server.discordVODChannel.length == 0) return;
    if (res._total == 0) return;
    if (!type) { logger.error(`[${server.name}/${twitchChannel.name}] VOD Type not defined`); return; }

    if (err) logger.error(`Error in start of postVOD: ${err} | ${twitchChannel.name} | ${server.name}`);
    MongoClient.connect(MongoUrl, { useNewUrlParser: true }, function (err, db) {
        if (err) throw err;
        var dbo = db.db("mhybot");
        var myquery = { _id: server._id, "twitchChannels.name": twitchChannel.name }
        dbo.collection("servers").findOne(myquery, function (err, dbres) {
            if (err) return err;
            videos = res.videos.reverse();
            videos.forEach((video) => {
                //return;
                var index = dbres.twitchChannels.findIndex(x => x.name === twitchChannel.name)
                switch (type) {
                    case "archive":
                        if (!dbres.twitchChannels[index].archivedate) { dbres.twitchChannels[index].archivedate = "1970-01-01T00:00:00Z" }
                        voddate = dbres.twitchChannels[index].archivedate
                        newvalues = { $set: { "twitchChannels.$.archivedate": video.created_at } }
                        notification = `New Twitch Archive from ${dbres.twitchChannels[index].display_name}`
                        break;

                    case "upload":
                        if (!dbres.twitchChannels[index].voddate) { dbres.twitchChannels[index].voddate = "1970-01-01T00:00:00Z" }
                        voddate = dbres.twitchChannels[index].voddate
                        newvalues = { $set: { "twitchChannels.$.voddate": video.created_at } }
                        notification = `New Twitch Upload from ${dbres.twitchChannels[index].display_name}`
                        break;

                    case "highlight":
                        if (!dbres.twitchChannels[index].highlightdate) { dbres.twitchChannels[index].highlightdate = "1970-01-01T00:00:00Z" }
                        voddate = dbres.twitchChannels[index].highlightdate
                        newvalues = { $set: { "twitchChannels.$.highlightdate": video.created_at } }
                        notification = `New Twitch Highlight from ${dbres.twitchChannels[index].display_name}`
                        break;
                }
                if (!res.stream) {
                } else {
                    if (twitchChannel.mention) {
                        var notification = `${twitchChannel.mention} - ${notification} - <${res.stream.channel.url}>`;
                    } else {
                        var notification = `${notification} - <${res.stream.channel.url}>`;
                    }
                }
                if (moment(voddate) < moment(video.created_at)) {
                    try {
                        newquery = { _id: server._id, "twitchChannels.name": twitchChannel.name }
                        dbo.collection("servers").updateOne(newquery, newvalues, function (err, res) { if (err) throw err; });
                        const guild = client.guilds.find(x => x.id === server.id);
                        const discordChannel = guild.channels.find(x => x.name === server.discordVODChannel);
                        const discordEmbed = createVODEmbed(server, twitchChannel, video);
                        discordChannel.send(notification, discordEmbed).then(
                            (message) => {
                                logger.info(`[${server.name}/${discordChannel.name}] Posted VOD for ${twitchChannel.name}: ${video.title}`)
                                // Write to DB latest video timestamp to prevent posting same video every tick

                            }
                        )
                    } catch (err) {
                        logger.error(`Error in end of postVOD: ${err} | ${twitchChannel.name} | ${server.name}`);
                    }
                }
            });
        })
    })
    db.close();
}

function postDiscord(server, twitchChannel, err, res) {
    if (!res) return;
    if (err) logger.error(`Error in postDiscord: ${err}`);
    if (!server.discordLiveChannel) return;
    if (server.discordLiveChannel.length == 0) return;

    // Add logic to set this variable based on option in DB
    if (!res.stream) {
    } else {
        if (twitchChannel.mention) {
            var notification = `${twitchChannel.mention} - ${twitchChannel.display_name} is live! - <${res.stream.channel.url}>`;
        } else {
            var notification = `${twitchChannel.display_name} is live! - <${res.stream.channel.url}>`;
        }
    }
    if (res.stream != null && twitchChannel.messageid == null) {
        // Do new message code
        try {
            const guild = client.guilds.find(x => x.name === server.name);
            const discordChannel = guild.channels.find(x => x.name === server.discordLiveChannel);
            const discordEmbed = createEmbed(server, twitchChannel, res);
            discordChannel.send(notification, discordEmbed).then(
                (message) => {
                    logger.info(`[${server.name}/${discordChannel.name}] Now Live: ${twitchChannel.name}`)
                    // Write to DB messageid
                    MongoClient.connect(MongoUrl, { useNewUrlParser: true }, function (err, db) {
                        if (err) throw err;
                        var dbo = db.db("mhybot");
                        messageid = message.id
                        var myquery = { _id: server._id, "twitchChannels.name": twitchChannel.name }
                        var newvalues = { $set: { "twitchChannels.$.messageid": message.id, "twitchChannels.$.online": true } }
                        dbo.collection("servers").updateOne(myquery, newvalues, function (err, res) {
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
            const guild = client.guilds.find(x => x.name === server.name);
            const discordChannel = guild.channels.find(x => x.name === server.discordLiveChannel);
            const discordEmbed = createEmbed(server, twitchChannel, res);

            discordChannel.fetchMessage(twitchChannel.messageid).then(
                message => message.edit(notification, discordEmbed).then((message) => {
                    logger.info(`[${server.name}/${discordChannel.name}] Channel Update: ${twitchChannel.name}`)
                })
            ).catch(error =>
                logger.error(`[${server.name}/${discordChannel.name}] Message Missing: ${twitchChannel.name}`)
            );
        } catch (err) {
            logger.error(`Error in postDiscord edit msg: ${err}`);
        }
    } else if (!res.stream && twitchChannel.messageid != null) {
        // Do delete message code
        try {
            const guild = client.guilds.find(x => x.name === server.name);
            const discordChannel = guild.channels.find(x => x.name === server.discordLiveChannel);
            twitchChannelInfo = server.twitchChannels.find(name => name.name.toLowerCase() === twitchChannel.name.toLowerCase())
            if (!server.postArchive) { server.postArchive = false }
            if (server.postArchive == true) {
                client.twitchapi.channels.videos({ channelID: twitchChannelInfo.id, broadcast_type: "archive", limit: "1" }, postVOD.bind(this, server, twitchChannelInfo, "archive"));
            }

            discordChannel.fetchMessage(twitchChannel.messageid).then(
                message => message.delete().then((message) => {
                    logger.info(`[${server.name}/${discordChannel.name}] Channel Offline: ${twitchChannel.name}`)
                    MongoClient.connect(MongoUrl, { useNewUrlParser: true }, function (err, db) {
                        if (err) throw err;
                        var dbo = db.db("mhybot");
                        var myquery = { _id: server._id, "twitchChannels.name": twitchChannel.name }
                        var newvalues = { $set: { "twitchChannels.$.messageid": null, "twitchChannels.$.online": false } }
                        dbo.collection("servers").updateOne(myquery, newvalues, function (err, res) {
                            if (err) throw err;
                            db.close();
                        })
                    })
                })
            ).catch(error =>
                logger.error(`[${server.name}/${discordChannel.name}] Message Missing: ${twitchChannel.name}`)
            );
        } catch (err) {
            logger.error(`Error in postDiscord delete msg: ${err}`);
        }
    }
}

function createYTEmbed(server, ytChannel, res) {
    try {
        // Create the embed code
        vod = res.items[0]
        // Limit description to 200 characters
        if (vod.snippet.description.length > 199) {
            vod.snippet.description = vod.snippet.description.substring(0, 199) + "[...]"
        }
        var embed = new Discord.RichEmbed()
            .setColor("#C4302B")
            .setTitle(vod.snippet.title)
            .setURL("https://youtu.be/" + vod.snippet.resourceId.videoId)
            .setDescription("**" + vod.snippet.channelTitle + "**\n" + vod.snippet.description.replace("/n/n", ""))
            .setThumbnail(ytChannel.icon)
            .setImage(vod.snippet.thumbnails.high.url)
            .setTimestamp()
        return embed;
    } catch (err) {
        console.log(vod);
        logger.error(`Error in createYTEmbed: ${err} | ${ytChannel.name} | ${server.name}`);
    }
}

function postYT(server, ytChannel) {
    if (!ytChannel) return;
    client.youtube.authenticate({ type: "key", key: client.youtube.clientID });
    client.youtube.playlistItems.list({ "part": "snippet", "maxResults": "1", "playlistId": ytChannel.uploadPlaylist }, function (err, res) {
        if (!res) return;
        if (res.pageInfo.totalResults == "0") return;
        const guild = client.guilds.find(x => x.id === server.id);
        const discordChannel = guild.channels.find(x => x.name === server.discordVODChannel);
        const discordEmbed = createYTEmbed(server, ytChannel, res);
        if (ytChannel.mention) {
            var notification = `${ytChannel.mention} - New YouTube Video from ${ytChannel.name} - <https://youtu.be/${vod.snippet.resourceId.videoId}>`;
        } else {
            var notification = `New YouTube Video from ${ytChannel.name} - <https://youtu.be/${vod.snippet.resourceId.videoId}>`;
        }
        if (!ytChannel.lastPublished) { ytChannel.lastPublished = "2010-01-01T00:00:00.000Z" }
        if (moment(res.items[0].snippet.publishedAt) > moment(ytChannel.lastPublished)) {
            discordChannel.send(notification, discordEmbed).then(
                (message) => {
                    logger.info(`[${server.name}/${discordChannel.name}] Posted YouTube Video for ${ytChannel.name}: ${res.items[0].snippet.title}`)
                    // Write to DB latest video timestamp to prevent posting same video every tick
                    newquery = { _id: server._id, "youtubeChannels.name": ytChannel.name }
                    newvalues = { $set: { "youtubeChannels.$.lastPublished": res.items[0].snippet.publishedAt } }
                    MongoClient.connect(MongoUrl, { useNewUrlParser: true }, function (err, db) {
                        var dbo = db.db("mhybot");
                        dbo.collection("servers").updateOne(newquery, newvalues, function (err, res) { if (err) throw err; });
                        if (err) throw err;
                        db.close();
                    });
                }
            )
        }
    })
}

function exitHandler(opt, err) {
    if (err) {
        logger.error(`Error in exitHandler: ${err}`);
    }
    if (opt.save) {
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
