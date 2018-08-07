winston = require('winston')
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log` 
      // - Write all logs error (and below) to `error.log`.
      //
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    ]
});
const 
    fs = require('fs'),
    Discord = require('discord.js'),
    client = new Discord.Client(),
    commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')),
    channelPath = __dirname + "/channels.json",
    timeout = 4*60*1000; // Set timeout to 2 minutes

const {prefix, discordtoken, twitchtoken} = require('./config/config.json');
var servers = [];
var twitchapi = require('twitch-api-v5');
var moment = require('moment');
twitchapi.clientID = twitchtoken;
//twitchapi.debug = true;
client.commands = new Discord.Collection();

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    // set a new item in the Collection
    // with the key as the command name and the value as the exported module
    client.commands.set(command.name, command);
}

function print(msg, err){
    var date = new Date();
    var h = leadingZero(date.getHours());
    var m = leadingZero(date.getMinutes());
    var s = leadingZero(date.getSeconds());

    console.log("[" + h + ":" + m + ":" + s + "]", msg);
    var guild = client.guilds.find("name", "Mhykol Twitch Discord");
    var channels = guild.channels.find("name", "bots");
    //channels.send("[" + h + ":" + m + ":" + s + "] " + msg);
    if(err){
        console.log(err);
    }
}

function leadingZero(d){
    if(d < 10){
        return "0" + d;
    }else{
        return d;
    }
}

client.on('ready', () => {
    print("Logged in to Discord");
    print("Reading file: " + channelPath);
    var file = fs.readFileSync(channelPath, {encoding:"utf-8"});
    servers = JSON.parse(file);

    // Tick twice at startup for weird bug reason
    tick();
    setTimeout(tick,10000);
    setInterval(tick, timeout);  
});

/*client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    var server, twitchChannels;
    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (!client.commands.has(commandName)) return;

    const command = client.commands.get(commandName);

    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, ${message.author}!`;
        if (command.usage) {
            reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
        }
        return message.channel.send(reply);
    }

    try {
        command.execute(message, args, twitchChannels);
    }
    catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
});*/

function indexOfObjectByName(array, value){
    for(let i = 0; i < array.length; i++){
        if(array[i].name.toLowerCase().trim() === value.toLowerCase().trim()){
            return i;
        }
    }
    return -1;
}

client.on("message", (message)=>{
    var server, twitchChannels;
    if(!message.guild){
        return;

    }else{
        let index = indexOfObjectByName(servers, message.guild.name);
        if(index == -1){
            servers.push({name: message.guild.name,
                          lastPrefix: "!", prefix: "~",
                          role: "botadmin", discordChannels: [],
                          twitchChannels: []});
            index = servers.length - 1;
        }

        server =  servers[index];
        twitchChannels = servers[index].twitchChannels;
    }

    if(message.content[0] == server.prefix){
        var permission;
        try {
            permission = message.member.roles.exists("name", server.role);
        }
        catch(err){
            print(server.role + " is not a role on the server", err);
        }

        let index;
        var streamer;
        if(message.content.substring(1, 7) == "remove"){
            if(permission){
                streamer = message.content.slice(7).trim();
                index = indexOfObjectByName(twitchChannels, streamer);
                if(index != -1){
                    twitchChannels.splice(index, 1);
                    index = indexOfObjectByName(twitchChannels, streamer);
                    if(index == -1){
                        message.reply("Removed " + streamer + ".");
                    }else{
                        message.reply(streamer + " isn't in the list.");
                    }
                }else{
                    message.reply(streamer + " isn't in the list.");
                }
            }else{
                message.reply("you're lacking the role _" + server.role + "_.");
            }

        }else if(message.content.substring(1, 4) == "add"){
            if(permission){
                streamer = message.content.slice(4).trim();
                var channelObject = {name: streamer};
                index = indexOfObjectByName(twitchChannels, streamer);
                twitchapi.users.usersByName(channelObject, (res)=>{
                    if(index != -1){
                        message.reply(streamer + " is already in the list.");
                    }else if(res.users.length > 0){
                        twitchChannels.push({name: streamer, timestamp: 0,
                                             online: false});
                        message.reply("Added " + streamer + ".");
                        //tick();
                    }else{
                        message.reply(streamer + " doesn't seem to exist.");
                    }
                });
            }else{
                message.reply("you're lacking the role _" + server.role + "_.");
            }

        }else if(message.content.substring(1, 5) == "list"){
            let msg = "\n";
            for(let i = 0; i < twitchChannels.length; i++){
                var streamStatus;
                if(twitchChannels[i].online){
                    msg += "**" + twitchChannels[i].name + " online**\n";
                }else{
                    streamStatus = "offline";
                    msg += twitchChannels[i].name + " offline\n";
                }
            }
            if(!msg){
                message.reply("The list is empty.");
            }else{
                message.reply(msg.replace(/_/g, "\\_"));
            }

        }else if(message.content.substring(1,10) == "configure"){
            let msg = "";
            if(message.guild.owner == message.member){
                if(message.content.substring(11, 15) == "list"){
                    msg += "```\n" +
                           "prefix    " + server.prefix + "\n" +
                           "role      " + server.role + "\n";

                    msg += "channels  " + server.discordChannels[0];
                    if(server.discordChannels.length > 1){
                        msg += ",";
                    }
                    msg += "\n";

                    for(let i = 1; i < server.discordChannels.length; i++){
                        msg += "          " + server.discordChannels[i];
                        if(i != server.discordChannels.length -1){
                            msg += ",";
                        }
                        msg += "\n";
                    }
                    msg += "```";

                }else if(message.content.substring(11, 17) == "prefix"){
                    let newPrefix = message.content.substring(18, 19);
                    if(newPrefix.replace(/\s/g, '').length === 0){
                        msg += "Please specify an argument";
                    }else if(newPrefix == server.prefix){
                        msg += "Prefix already is " + server.prefix;
                    }else{
                        server.lastPrefix = server.prefix;
                        server.prefix = newPrefix;
                        msg += "Changed prefix to " + server.prefix;
                    }

                }else if(message.content.substring(11, 15) == "role"){
                    if(message.content.substring(16).replace(/\s/g, '').length === 0){
                        msg += "Please specify an argument";
                    }else{
                        server.role = message.content.substring(16);
                        msg += "Changed role to " + server.role;
                    }

                }else if(message.content.substring(11, 18) == "channel"){
                    if(message.content.substring(19, 22) == "add"){
                        let channel = message.content.substring(23);
                        if(channel.replace(/\s/g, '').length === 0){
                            msg += "Please specify an argument";
                        }else if(message.guild.channels.exists("name", channel)){
                            server.discordChannels.push(channel);
                            msg += "Added " + channel + " to list of channels to post in.";
                        }else{
                            msg += channel + " does not exist on this server.";
                        }

                    }else if(message.content.substring(19, 25) == "remove"){
                        for(let i = server.discordChannels.length; i >= 0; i--){
                            let channel = message.content.substring(26);
                            if(channel.replace(/\s/g, '').length === 0){
                                msg = "Please specify an argument";
                                break;
                            }else if(server.discordChannels[i] == channel){
                                server.discordChannels.splice(i, 1);
                                msg = "Removed " + channel + " from list of channels to post in.";
                                break;
                            }else{
                                msg = channel + " does not exist in list.";
                            }
                        }
                    }else{
                        msg = "Please specify an argument for channel";
                    }

                }else{
                    msg += "```\n" +
                           "Usage: " + server.prefix + "configure OPTION [SUBOPTION] VALUE\n" +
                           "Example: " + server.prefix + "configure channel add example\n" +
                           "\nOptions:\n" +
                           "  list        List current config\n" +
                           "  prefix      Character to use in front of commands\n" +
                           "  role        Role permitting usage of add and remove\n" +
                           "  channel     Channel(s) to post in, empty list will use the first channel\n" +
                           "      add         Add a discord channel to the list\n" +
                           "      remove      Remove a discord channel from the list\n" +
                           "```";
                }

            }else{
                msg += "You are not the server owner.";
            }
            message.reply(msg);

        }else{
            message.reply("Usage:\n" + server.prefix +
                               "[configure args|list|add channel_name|remove channel_name]");
        }
    }else if(message.content[0] == server.lastPrefix){
        message.reply("The prefix was changed from `" + server.lastPrefix +
                      "` to `" + server.prefix +
                      "`. Please use the new prefix.");
    }
});

function tick(){
    servers.forEach((server) => {
        twitchapi.users.usersByName({ users: server.twitchChannels.map(x => x.name) },getChannelInfo.bind(this, server))        
    })
    savechannels();
    print("Tick happened!")
}

function getChannelInfo(server, err, res) {
    if (!res) return;

    res.users.forEach((user) => {
        channelID = user._id;
        twitchChannel = server.twitchChannels.find(name => name.name.toLowerCase() === user.name.toLowerCase())
        twitchapi.streams.channel({channelID: user._id }, postDiscord.bind(this, server, twitchChannel));
    })
}

function fancyTimeFormat(time)
{   
    // Hours, minutes and seconds
    var hrs = ~~(time / 3600);
    var mins = ~~((time % 3600) / 60);
    var secs = time % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";

    if (hrs > 1) {
        ret += "" + hrs + " hours, "
    } else if (hrs == 1) {
        ret += "" + hrs + " hour, "
    }

    if (mins > 1) {
        ret += "" + mins + " minutes"
    } else if (mins == 1) {
        ret += "" + mins + " minute"
    }

    if (hrs == 0 && mins == 0) {
        ret = "Just now"
    }
   // ret += "" + secs + " seconds";
    return ret;
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
    if(!res) return;
    if(res.stream != null && twitchChannel.messageid == null) {
        // Do new message code
        try {
            var channels = [], defaultChannel;
            var guild = client.guilds.find("name", server.name);

            if(server.discordChannels.length === 0){
                defaultChannel = guild.channels.find("type", "text");
            }else{
                for(let i = 0; i < server.discordChannels.length; i++){
                    channels.push(guild.channels.find("name", server.discordChannels[i]));
                }
            }
            discordEmbed = createEmbed(server, twitchChannel, res);
            if(channels.length !== 0){
                for(let i = 0; i < channels.length; i++){
                    channels[i].send(discordEmbed).then(
                        (message) => { 
                        print(`[${server.name}/${channels[i].name}] Now Live: ${twitchChannel.name}`)
                        twitchChannel.messageid = message.id
                    });    
                }
                twitchChannel.online = true;
                twitchChannel.timestamp = Date.now();
            }else if(defaultChannel){
                defaultChannel.send(embed).then(
                    (message) => {
                    print(`[${server.name}/${defaultChannel.name}] Now Live: ${twitchChannel.name}`)
                    twitchChannel.messageid = message.id
                    });
                twitchChannel.online = true;
                twitchChannel.timestamp = Date.now();
            }
        }
        catch(err){
            print(err);
        }
    } else if (res.stream != null && twitchChannel.messageid != null) {
        // Do edit message code
        try {
            var channels = [], defaultChannel;
            var guild = client.guilds.find("name", server.name);

            if(server.discordChannels.length === 0){
                defaultChannel = guild.channels.find("type", "text");
            }else{
                for(let i = 0; i < server.discordChannels.length; i++){
                    channels.push(guild.channels.find("name", server.discordChannels[i]));
                }
            }
            discordEmbed = createEmbed(server, twitchChannel, res);
            if(channels.length !== 0){
                for(let i = 0; i < channels.length; i++){
                    channels[i].fetchMessage(twitchChannel.messageid).then(
                        message => message.edit(discordEmbed).then((message) => { 
                        print(`[${server.name}/${channels[i].name}] Channel Update: ${twitchChannel.name}`)
                        twitchChannel.messageid = message.id
                    }));    
                }
                twitchChannel.online = true;
                twitchChannel.timestamp = Date.now();
            }else if(defaultChannel){
                defaultChannel.fetchMessage(twitchChannel.messageid).then(
                    message => message.edit(discordEmbed).then((message) => { 
                    print(`[${server.name}/${defaultChannel.name}] Channel Update: ${twitchChannel.name}`)
                    //print(message.id)
                    twitchChannel.messageid = message.id
                }));
                twitchChannel.online = true;
                twitchChannel.timestamp = Date.now();
            }
        }
        catch(err){
            print(err);
        }
    } else if (res.stream == null && twitchChannel.messageid != null) {
        // Do delete message code
        try {
            var channels = [], defaultChannel;
            var guild = client.guilds.find("name", server.name);

            if(server.discordChannels.length === 0){
                defaultChannel = guild.channels.find("type", "text");
            }else{
                for(let i = 0; i < server.discordChannels.length; i++){
                    channels.push(guild.channels.find("name", server.discordChannels[i]));
                }
            }
            if(channels.length !== 0){
                for(let i = 0; i < channels.length; i++){
                    channels[i].fetchMessage(twitchChannel.messageid).then(
                        message => message.delete().then( (message) => {
                        print(`[${server.name}/${channels[i].name}] Channel Offline: ${twitchChannel.name}`)
                        twitchChannel.messageid = null
                    }));    
                }
                twitchChannel.online = false;
            }else if(defaultChannel){
                defaultChannel.fetchMessage(twitchChannel.messageid).then(
                    message => message.delete().then( (message) => {
                    print(`[${server.name}/${defaultChannel.name}] Channel Offline: ${twitchChannel.name}`)
                    twitchChannel.messageid = null
                }));
                twitchChannel.online = false;
            }
        }
        catch(err){
            print(err);
        }
    }
}

function savechannels() {
    print("Saving channels to " + channelPath);
    fs.writeFileSync(channelPath, JSON.stringify(servers, null, 4));
    print("Done");
}

function exitHandler(opt, err){
    if(err){
        print(err);
    }
    if(opt.save){
        savechannels();
    }
    if(opt.exit){
        process.exit();
    }
}

process.on("exit", exitHandler.bind(null, {save:true}));
process.on("SIGINT", exitHandler.bind(null, {exit:true}));
process.on("SIGTERM", exitHandler.bind(null, {exit:true}));
process.on("uncaughtException", exitHandler.bind(null, {exit:true}));

try {
    client.login(discordtoken)
} catch(error) {
    print(error);  
}
