const Discord = require('discord.js');
const client = new Discord.Client();


function start() {
    const parsed = commandLineArgs(options);
    let configInfo: Config = null;
    if (Object.keys(parsed).length === 0) {
        try {
            configInfo = require("./config/config");
        } catch (e) {
            configInfo = null;
        }
        if (configInfo == null) {
            Logger.error("Could not start bot! Please specify command line args or include a config file.");
            return;
        }
    } else {
        if (parsed.username == null) {
            Logger.error("Could not start bot! Username argument not specified.");
            return;
        }
        if (parsed.token == null) {
            Logger.error("Could not start bot! Token argument not specified.");
            return;
        }
        if (parsed.channel == null) {
            Logger.error("Could not start bot! Channel argument not specified.");
            return;
        }
        configInfo = exampleConfig;
        configInfo.bot = {username: parsed.username, token: parsed.token, channel: parsed.channel};
    }
    client.on('ready', () => {
        console.log('Ready!');
    });
    
    client.login(parsed.token);
}

start();

