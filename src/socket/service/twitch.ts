import { Service } from '../';
import { Logger } from '../../logger';
import { Utils } from '../../utils';
import { EventCodeMapping, EventType } from '../../utils/event';

import * as Constants from "../../constant/twitch";

import chalk = require('chalk');

/**
 * Twitch chat service extends the default service implementation.
 * @export
 * @class Twitch
 * @extends {Service}
 */
export class Twitch extends Service {

    protected eventMappings: EventCodeMapping = {
        "376": EventType.CONNECTION,
        "PRIVMSG": EventType.MESSAGE
    }

    /**
     * Creates an instance of Twitch.
     * @param {Login} twitch login info.
     * @memberOf Twitch
     */
    constructor(protected config: Config) {
        super(Constants.URL, "Twitch", config);
        this.parser.messages.subscribe(
            (message: Message) => {
                super.onMessage(message);
            },
            (error: any) => {
                Logger.error(error);
            },
            () => {
                Logger.log("Closing message handler...");
            }
        );
        this.parser.connections.subscribe(
            (channel: Message) => {
                super.connected();
            },
            (error: any) => {
                Logger.error(error);
            },
            () => {
                Logger.log("Disconnecting...");
                // TODO: Kill websocket?
            }
        );
    }

    /**
     * Calls login info when the socket is opened.
     * @protected
     * @memberOf Twitch
     */
    protected async onOpen(): Promise<boolean> {
        let hasErrorCap = await super.send(`CAP REQ ${Constants.CAPS}`);
        let hasErrorPass = await super.send(`PASS ${this.config.bot.token}`);
        let hasErrorNick = await super.send(`NICK ${this.config.bot.username}`);
        return hasErrorCap || hasErrorPass || hasErrorNick;
    }

    /**
     * Called on ping and just pong back and return.
     * @protected
     * @returns if pinging the socket errored
     * @memberOf Twitch
     */
    protected async onPing(): Promise<boolean> {
        return await super.send(Constants.PONG);
    }

    /**
     * Joins a twitch channel chat.
     * @param {string} twitch channel name.
     * @returns if the joining the channel errored
     * @memberOf Twitch
     */
    public async joinChannel(channel: string): Promise<boolean> {
        let hasError = await super.send(`JOIN #${channel.toLowerCase()}`);
        if (!hasError) {
            Logger.bot(this.botName, `Joined ${this.serviceName} channel > ${channel.toLowerCase()}`);
        }
        return hasError;
    }

    /**
     * Sends a message to a twitch channel chat.
     * @param {string} twitch channel name.
     * @param {string} the message contents.
     * @returns if the sending the message errored
     * @memberOf Twitch
     */
    public async sendMessage(channel: string, message: string): Promise<boolean> {
        let hasError = await super.send(`PRIVMSG #${channel.toLowerCase()} :${message}`);
        if (!hasError) {
            Logger.bot(this.botName, `(${channel}) < ${message}`);
        }
        return hasError;
    }

    /**
     * Parses the websocket message to a readable format and execute anything that needs to.
     * @protected
     * @param {string} the raw websocket message.
     * @memberOf Twitch
     */
    protected async parseMessage(rawMessage: string): Promise<Message> {
        // console.log(rawMessage);
        let tags: Map<string, string> = new Map();
        let messageParts = rawMessage.split(" :", 3);
        let userName = "";
        let channel = "";
        let eventCode = "";
        let message: string;
        // Handle tags portion of message.
        if (messageParts[0].startsWith("@")) {
            tags = new Map();
            let tagParts = messageParts[0].substring(1).split(";");
            tagParts.forEach(tagPart => {
                let keyValues = tagPart.split("=");
                if (keyValues.length > 0) {
                    tags.set(keyValues[0], keyValues.length === 1 ? "" : keyValues[1]);
                }
            });
            messageParts[0] = messageParts[1];
            if (messageParts.length > 2) {
                messageParts[1] = messageParts[2];
            }
        } else {
            tags = new Map();
        }
        // Cut leading space.
        if (messageParts[0].startsWith(" ")) {
            messageParts[0] = messageParts[0].substring(1);
        }
        // Cut leading space, trailing junk character, and assign message.
        if (messageParts.length > 1) {
            if (messageParts[1].startsWith(" ")) {
                messageParts[1] = messageParts[1].substring(1);
            }
            message = messageParts[1];
            if (message.length > 1) {
                message = message.substring(0, message.length - 1);
            }
        } else {
            message = "";
        }
        // Get username if present.
        if (Utils.contains(messageParts[0], "!")) {
            userName = messageParts[0].substring(messageParts[0].indexOf("!") + 1, messageParts[0].indexOf("@"));
        }
        // Get channel if present.
        if (Utils.contains(messageParts[0], "#")) {
            channel = messageParts[0].substring(messageParts[0].indexOf("#") + 1);
        }
        // Get the event code.
        eventCode = messageParts[0].split(" ")[1];

        // Execute the event parser if a parser exists.
        return { eventCode: eventCode, username: await this.getDisplayName(tags, userName), channel: channel.toLowerCase(), text: message };
    }

    /**
     * Create a user object with needed info from tags.
     * @private
     * @param {Map<string, string>} info tags about the user.
     * @param {string} default username not formated.
     * @returns {User} user info.
     * @memberOf Twitch
     */
    private async getDisplayName(tags: Map<string, string>, userName: string): Promise<string> {
        if (tags.has("display-name")) {
            return tags.get("display-name");
        }
        return userName;
    }
}
