import { Twitch } from "./socket/service/twitch";
import { Logger } from "./logger";
const commandLineArgs = require("command-line-args");
const exampleConfig = require("./config/example");

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

const options = [
    { name: "username", alias: "u", type: String },
    { name: "token", alias: "t", type: String },
    { name: "channel", alias: "c", type: String }
];

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

    const socket = new Twitch(configInfo);

    Logger.log("Starting bot...");

    socket.connect({
        connected: () => {
            socket.joinChannel(configInfo.bot.channel);
        }
    });
}

start();
