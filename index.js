// Load dependencies
const
    fs = require('fs'),
    Discord = require('discord.js'),
    YouTube = require('youtube-api'),
    Twitter = require('twitter'),
    pubSubHubbub = require('pubsubhubbub'),
    xml2js = require('xml2js'),
    winston = require('winston'),
    twitchapi = require('twitch-api-v5'),
    moment = require('moment'),
    MongoClient = require('mongodb').MongoClient,
    schedule = require('node-schedule')

// Load config
const {connections, database, pubsub_server, configs} = require('./config/config.json');

// Set Dependency Options
const alignedWithColorsAndTime = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.printf((info) => {
        const { timestamp, level, message, ...args } = info;
        const ts = timestamp.slice(0, 19).replace('T', ' ');
        let format = `${ts} [${level}]: ${message}`;
        if (Object.keys(args).length) format += ' ' + JSON.stringify(args, null, 2)
        return format;
    })
),
    logger = winston.createLogger({
        level: configs.logging_level,
        format: winston.format.json(),
        transports: [
            //new winston.transports.Console({ format: winston.format.simple() }),
            new winston.transports.Console({ format: alignedWithColorsAndTime }),
            new winston.transports.File({ filename: 'logs/latest.log', format: alignedWithColorsAndTime }),
            new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        ]
    });

var twitterConnect = new Twitter({
    consumer_key: connections.twitter.key,
    consumer_secret: connections.twitter.secret,
    bearer_token: connections.twitter.bearer
}),
    pubSubOptions = {
        port: pubsub_server.port,
        callbackUrl: `${pubsub_server.protocol}://${pubsub_server.address}:${pubsub_server.port}`
    },
    pubsub = pubSubHubbub.createServer(pubSubOptions),
    xmlParser = new xml2js.Parser(),
    MongoUrl = "mongodb://" + database.user + ":" + database.password + "@" + database.address + ":" + database.port + "?authMechanism=DEFAULT&authSource=mhybot",
    client = new Discord.Client()
pubsub.listen(1337);

// Set Variables

var commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')),
    timeout = 4 * 60 * 1000,
    { fancyTimeFormat, fancyDurationFormat } = require('./utils.js');
client.twitchapi = twitchapi;
client.youtube = YouTube;
client.youtube.clientID = connections.youtube.client_id;
client.twitter = twitterConnect;
client.servers = [];
client.twitchapi.clientID = connections.twitch.token;
client.commands = new Discord.Collection();
client.MongoClient = MongoClient;
client.MongoUrl = MongoUrl;
client.logger = logger;
client.pubsub = pubsub;
client.pubsub.hub = "https://pubsubhubbub.appspot.com/";
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

// Database connection
logger.verbose(`Connecting to MongoDB...`);
MongoClient.connect(MongoUrl, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, db) {
    if (err) return logger.error(`Issues connection to MongoDB: ${err}`)
    client.db = db;
    client.dbo = db.db(database.name);
    logger.info(`Connected to MongoDB.`, `\n`)

    logger.verbose("Connecting to Discord...", "\n");
    try {
        client.login(connections.discord.token)
        logger.info("Logged in to Discord");
    } catch (err) {
        logger.error(`Error in Discord login: ${err}`);
    }
})

client.on('ready', () => {
    logger.info("Ready!");
    tick();
    setInterval(tick, timeout);
});


pubsub.on('feed', (res) => {
    xmlParser.parseString(res.feed.toString(), (err, res) => {
        if (err) return console.error(err);
        if (!res.feed.entry) return;
        var ytFeed = [];
        ytFeed.channelId = res.feed.entry[0]["yt:channelId"][0]
        ytFeed.videoId = res.feed.entry[0]["yt:videoId"][0]
        client.dbo.collection("servers").find({ "youtubeChannels.id": ytFeed.channelId }).toArray(function (err, res) {
            res.forEach((server) => {
                if (server.youtubeChannels) {
                    server.youtubeChannels.forEach((ytChannel) => postYT(server, ytChannel, ytFeed))
                }
            })
        });
    });
});
pubsub.on("subscribe", function (data) {
    logger.info(`[PubSub/Subscribed] ${data.topic}`);
});
pubsub.on("unsubscribe", function (data) {
    logger.info(`[PubSub/Unsubscribed] ${data.topic}`);
});
pubsub.on("error", function (error) {
    logger.error(error);
});
pubsub.on("denied", function (data) {
    logger.error(data);
});
var resubschedule = schedule.scheduleJob('0 0 4 */2 * *', function () {
    client.dbo.collection("servers").find({}).toArray(function (err, res) {
        res.forEach((server) => {
            if (server.youtubeChannels) {
                server.youtubeChannels.forEach((ytChannel) => {
                    var topic = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${ytChannel.id}`
                    client.pubsub.subscribe(topic, client.pubsub.hub, function (err) {
                        if (err) {
                            return client.logger.error(`[Scheduled Resub] Unable to resubscribe to YouTube Channel ${ytChannel.name}: ${err}`);
                        } else {
                            return client.logger.info(`[Scheduled Resub] Resubscribed to YouTube Channel ${ytChannel.name}`);
                        }
                    })
                })
            }
        })
    });
})
client.on('message', message => {
    const new_server_obj = {
        name: message.guild.name,
        id: message.guild.id,
        prefix: configs.default_prefix,
        role: configs.default_management_role,
        discordLiveChannel: null,
        discordVODChannel: null,
        postarchive: null,
        twitchChannels: [],
        youtubeChannels: []
    }
    client.dbo.collection("servers").findOne({ id: message.guild.id }, function (err, res) {
        if (err) throw err;
        if (!res) {
            client.dbo.collection("servers").insertOne(new_server_obj, function (err, res) {
                if (err) throw err;
                logger.info(`[${message.guild.name}] New server added to database`)
            })
            client.currentserver = new_server_obj;
        } else {
            client.currentserver = res;
        }
        var server = client.currentserver;
        if (!message.content.startsWith(server.prefix) || message.author.bot) return;

        const args = message.content.slice(server.prefix.length).match(/(?:[^\s"']+|(?:"[^"]*")|(?:'[^']*'))+/g);
        args.forEach(function(value, index, array){
            const len = value.length-1;
            if ((value[0] == '"' && value[len] == '"') || (value[0] == "'" && value[len] == "'")) {
                args[index] = value.substr(1, len - 1);
            }
        });

        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) return;

        let permissions = ['user'];
        if (message.member.roles.cache.some(x => x.name === server.role)) {
            permissions.push('admin');
        }

        if (message.guild.owner == message.member) {
            permissions.push('admin');
            permissions.push('owner');
        }

        if (message.member.id == configs.bot_owner_user_id) {
            permissions.push('admin');
            permissions.push('owner');
            permissions.push('botowner');
        }

        if (command.permission && !(permissions.indexOf(command.permission) > -1)) {
            // user not allowed...
            message.reply(`You do not have the required permission \`${command.permission}\` to run this command.`);
            return;
        }

        if (command.args && (!command.allowNoSubcommand && !args.length)) {
            let reply = `You didn't provide any arguments, ${message.author}!`;
            if (command.usage) {
                if (typeof command.usage == 'object') {
                    // Should technically be array, but jS dUmB
                    reply += '\nThe proper usages would be:\n';
                    command.usage.forEach(function(usage) {
                        reply += '`' + server.prefix + command.name + ' ' + usage + '`\n';
                    });
                } else {
                    reply += `\nThe proper usage would be: \`${server.prefix}${command.name} ${command.usage}\``;
                }
            }
            return message.channel.send(reply);
        }

        try {
            command.execute(client, message, args);
            //message.reply('commands have been disabled temporarily.');
        }
        catch (error) {
            // Only do this on non-dev envs! This is causing error output and stack traces to not show
            if (["dev", "local"].includes(configs.environment)) console.log(error);
            else logger.error(error);
            // if (!(configs.environment in ["dev", "local"])) logger.error(error);
            message.reply('There was an error trying to execute that command!');
        }
    })
});

// ** Tick Function - runs on interval (default 4 minutes) **
function tick() {
    try {
        client.dbo.collection("servers").find().toArray(function (err, result) {
            //dbo.collection("servers");
            result.forEach((server) => {
                try {
                    client.twitchapi.users.usersByName({ users: server.twitchChannels.map(x => x.name) }, getChannelInfo.bind(this, server))
                } catch (err) {
                    logger.error(`Error in tick: ${err}`);
                }

            })
        })
        logger.debug("Tick happened!")
    } catch (err) {
        logger.error(`Error in tick: ${err}`)
    }
}

function getChannelInfo(server, err, res) {
    if (!res) return;
    if (err) logger.error(`Error in getChannelInfo: ${err}`);
    res.users.forEach((user) => {
        let twitchChannelInfo = server.twitchChannels.find(name => name.name.toLowerCase() === user.name.toLowerCase())
        try {
            let myquery = { _id: server._id, "twitchChannels.name": twitchChannelInfo.name }
            let newvalues = { $set: { "twitchChannels.$.id": user._id, "twitchChannels.$.display_name": user.display_name, "twitchChannels.$.name": user.name.toLowerCase() } }
            client.dbo.collection("servers").updateOne(myquery, newvalues, function (err, res) {
                if (err) throw err;
            });
        } catch (err) {
            console.log(`Error in user database update: ${err}`)
        }
        client.twitchapi.streams.channel({ channelID: user._id }, postDiscord.bind(this, server, twitchChannelInfo));

        server.postUploads = server.postUploads || false;
        if (server.postUploads) {
            client.twitchapi.channels.videos({ channelID: user._id, broadcast_type: "upload", limit: "1" }, postVOD.bind(this, server, twitchChannelInfo, "upload"));
        }

        server.postHighlights = server.postHighlights || false;
        if (server.postHighlights) {
            client.twitchapi.channels.videos({ channelID: user._id, broadcast_type: "highlight", limit: "4" }, postVOD.bind(this, server, twitchChannelInfo, "highlight"));
        }
    })
}

function postVOD(server, twitchChannel, type, err, res) {
    if (!res) return;
    if (!server.discordVODChannel) return;
    if (server.discordVODChannel.length == 0) return;
    if (res._total == 0) return;
    if (!type) { logger.error(`[${server.name}/${twitchChannel.name}] VOD Type not defined`); return; }

    if (err) logger.error(`Error in start of postVOD: ${err} | ${twitchChannel.name} | ${server.name}`);
    var myquery = { _id: server._id, "twitchChannels.name": twitchChannel.name }
    client.dbo.collection("servers").findOne(myquery, function (err, dbres) {
        if (err) return err;
        videos = res.videos.reverse();
        videos.forEach((video) => {
            //return;
            var index = dbres.twitchChannels.findIndex(x => x.name === twitchChannel.name)
            switch (type) {
                case "archive":
                    // if (!dbres.twitchChannels[index].archivedate) { dbres.twitchChannels[index].archivedate = "1970-01-01T00:00:00Z" }
                    voddate = dbres.twitchChannels[index].archivedate || "1970-01-01T00:00:00Z";
                    newvalues = { $set: { "twitchChannels.$.archivedate": video.created_at } }
                    notification = `New Twitch Archive from ${dbres.twitchChannels[index].display_name}`
                    break;

                case "upload":
                    // if (!dbres.twitchChannels[index].voddate) { dbres.twitchChannels[index].voddate = "1970-01-01T00:00:00Z" }
                    voddate = dbres.twitchChannels[index].voddate || "1970-01-01T00:00:00Z"
                    newvalues = { $set: { "twitchChannels.$.voddate": video.created_at } }
                    notification = `New Twitch Upload from ${dbres.twitchChannels[index].display_name}`
                    break;

                case "highlight":
                    // if (!dbres.twitchChannels[index].highlightdate) { dbres.twitchChannels[index].highlightdate = "1970-01-01T00:00:00Z" }
                    voddate = dbres.twitchChannels[index].highlightdate || "1970-01-01T00:00:00Z"
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
                    client.dbo.collection("servers").updateOne(newquery, newvalues, function (err, res) { if (err) throw err; });
                    const guild = client.guilds.cache.find(x => x.id === server.id);
                    const discordChannel = guild.channels.cache.find(x => x.name === server.discordVODChannel);
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
            const guild = client.guilds.cache.find(x => x.name === server.name);
            const discordChannel = guild.channels.cache.find(x => x.name === server.discordLiveChannel);
            const discordEmbed = createEmbed(server, twitchChannel, res);
            discordChannel.send(notification, discordEmbed).then(
                (message) => {
                    logger.info(`[${server.name}/${discordChannel.name}] Now Live: ${twitchChannel.name}`)
                    // Write to DB messageid
                    messageid = message.id
                    var myquery = { _id: server._id, "twitchChannels.name": twitchChannel.name }
                    var newvalues = { $set: { "twitchChannels.$.messageid": message.id, "twitchChannels.$.online": true } }
                    client.dbo.collection("servers").updateOne(myquery, newvalues, function (err, res) {
                        if (err) throw err;
                    })
                })
        } catch (err) {
            logger.error(`Error in postDiscord new msg: ${err}`);
        }
    } else if (res.stream != null && twitchChannel.messageid != null) {
        // Do edit message code
        try {
            const guild = client.guilds.cache.find(x => x.name === server.name);
            const discordChannel = guild.channels.cache.find(x => x.name === server.discordLiveChannel);
            const discordEmbed = createEmbed(server, twitchChannel, res);

            discordChannel.messages.fetch(twitchChannel.messageid).then(
                message => message.edit(notification, discordEmbed).then((message) => {
                    logger.info(`[${server.name}/${discordChannel.name}] Channel Update: ${twitchChannel.name}`)
                })
            ).catch(error => {
                logger.error(`[${server.name}/${discordChannel.name}] Message Missing: ${twitchChannel.name}`)
                var myquery = { _id: server._id, "twitchChannels.name": twitchChannel.name }
                var newvalues = { $set: { "twitchChannels.$.messageid": null, "twitchChannels.$.online": false } }
                client.dbo.collection("servers").updateOne(myquery, newvalues, function (err, res) {
                    if (err) throw err;
                    if (res) {
                        logger.info(`[${server.name}/${discordChannel.name}] Removed missing message from DB for ${twitchChannel.name}`)
                    }
                })
            }
            );
        } catch (err) {
            logger.error(`Error in postDiscord edit msg: ${err}`);
        }
    } else if (!res.stream && twitchChannel.messageid != null) {
        // Do delete message code
        try {
            const guild = client.guilds.cache.find(x => x.name === server.name);
            const discordChannel = guild.channels.cache.find(x => x.name === server.discordLiveChannel);
            twitchChannelInfo = server.twitchChannels.find(name => name.name.toLowerCase() === twitchChannel.name.toLowerCase())
            if (!server.postArchive) { server.postArchive = false }
            if (server.postArchive == true) {
                client.twitchapi.channels.videos({ channelID: twitchChannelInfo.id, broadcast_type: "archive", limit: "1" }, postVOD.bind(this, server, twitchChannelInfo, "archive"));
            }

            discordChannel.messages.fetch(twitchChannel.messageid).then(
                message => message.delete().then((message) => {
                    logger.info(`[${server.name}/${discordChannel.name}] Channel Offline: ${twitchChannel.name}`)
                    var myquery = { _id: server._id, "twitchChannels.name": twitchChannel.name }
                    var newvalues = { $set: { "twitchChannels.$.messageid": null, "twitchChannels.$.online": false } }
                    client.dbo.collection("servers").updateOne(myquery, newvalues, function (err, res) {
                        if (err) throw err;
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

function postYT(server, ytChannel, ytFeed) {
    if (!ytChannel) return;
    if (ytChannel.id != ytFeed.channelId) return;
    client.youtube.authenticate({ type: "key", key: client.youtube.clientID });
    if (!ytChannel.lastVideoId) { ytChannel.lastVideoId = "" }
    client.youtube.playlistItems.list({ "part": "snippet", "maxResults": "1", "playlistId": ytChannel.uploadPlaylist }, function (err, res) {
        if (!res) return;
        if (res.items[0].id == ytChannel.lastVideoId) return;
        if (res.pageInfo.totalResults == "0") return;
        const guild = client.guilds.cache.find(x => x.id === server.id);
        const discordChannel = guild.channels.cache.find(x => x.name === server.discordVODChannel);
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
                    newvalues = { $set: { "youtubeChannels.$.lastPublished": res.items[0].snippet.publishedAt, "youtubeChannels.$.lastVideoId": res.items[0].id } }
                    client.dbo.collection("servers").updateOne(newquery, newvalues, function (err, res) { if (err) throw err; });
                    if (err) throw err;

                }
            )
        }

    })
}

function postTwitter(server, twAccount) {
    // Post Twitter Code
    if (!twAccount.screenName) return;
    var params = {
        screen_name: twAccount.screenName,
        since_id: "1113600171361828900"
    }
    client.twitter.get('statuses/user_timeline', params, function (error, tweets, response) {
        if (!error) {
            console.log(tweets);
            discordChannel.send()
        }
    })
}


// ** Embed creation functions **

function createEmbed(server, twitchChannel, res) {
    // Create the embed code
    var startDate = moment(res.stream.created_at)
    var endDate = moment.now()
    twitchChannel.uptime = moment(endDate).diff(startDate, 'seconds')
    var embed = new Discord.MessageEmbed()
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
        var embed = new Discord.MessageEmbed()
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

function createYTEmbed(server, ytChannel, res) {
    try {
        // Create the embed code
        vod = res.items[0]
        // Limit description to 200 characters
        if (vod.snippet.description.length > 199) {
            vod.snippet.description = vod.snippet.description.substring(0, 199) + "[...]"
        }
        var embed = new Discord.MessageEmbed()
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

function twitterEmbed(server, twAccount, res) {
    // Create Twitter Embed
}

function exitHandler(opt, err) {
    if (err) {
        logger.error(`Error in exitHandler: ${err}`);
    }
    if (opt.save) {
    }
    if (opt.exit) {
        client.db.close();
        process.exit();
    }
}

process.on("exit", exitHandler.bind(null, { exit: true }));
process.on("SIGINT", exitHandler.bind(null, { exit: true }));
process.on("SIGTERM", exitHandler.bind(null, { exit: true }));
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));


