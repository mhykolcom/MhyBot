import { CommandHandler } from '../command';
import { Logger } from '../logger';
import { Parser } from '../parser';
import { Utils } from '../utils';
import { EventType } from '../utils/event';

import chalk = require('chalk');
import Websocket = require('ws');

/**
 * The default abstract service that other services should extend.
 * @export
 * @abstract
 * @class Service
 */
export abstract class Service {

    public botName = "";
    private socket: Websocket = null;
    protected isConnected = false;
    protected callback: ConnectCallback = null;
    protected commandHandler: CommandHandler = null;
    protected parser: Parser;
    protected eventMappings: {[event: string]: EventType};

    /**
     * Creates an instance of Service.
     * @param {string} the websocket url.
     * @param {Login} the login info for the service.
     * @memberOf Service
     */
    public constructor(protected socketUrl: string, public serviceName: string, protected config: Config) {
        this.botName = config.bot.username;
        this.parser = new Parser(serviceName);
        this.commandHandler = new CommandHandler();
    }

    /**
     * Call connect to connect to said socket service.
     * @param {ConnectCallback} callback.
     * @memberOf Socket
     */
    public async connect(callback: ConnectCallback) {
        // Do not allow connecting if already connected.
        if (this.isConnected) {
            return;
        }
        this.callback = callback;
        this.socket = new Websocket(this.socketUrl);
        Logger.log("Connecting to websocket...");
        this.isConnected = true;
        this.socket.on("open", () => {
            // Send caps and login info
            this.onOpen().then((errored) => {
                if (!errored) {
                    // Websocket got a message lets parse it
                    this.socket.on("message", (rawMessage: string) => {
                        // TODO: This shouldn't be here
                        if (rawMessage.startsWith("PING")) {
                            this.onPing();
                            return;
                        }
                        this.parseData(rawMessage);
                    });
                    // Websocket closed
                    this.socket.on("close", (code: number, message: string) => {
                        this.isConnected = false;
                        Logger.warn(`Closed (${code}): ${message}`);
                    });
                }
            });
        });
        // Error on websocket
        this.socket.on("error", (err: Error) => {
            Logger.error(err.message);
        });
    }

    protected connected() {
        this.isConnected = true;
        if (this.callback !== undefined) {
            Logger.bot(this.botName, `Connected to ${this.serviceName}`);
            this.callback.connected();
        }
    }

    /**
     * Called when the socket is opened.
     * @protected
     * @abstract
     * @memberOf Service
     */
    protected abstract async onOpen(): Promise<boolean>;

    /**
     * Called when a message startsWith PING.
     * @protected
     * @abstract
     * @returns {boolean} if should return.
     * @memberOf Service
     */
    protected abstract async onPing(): Promise<boolean>;

    /**
     * Call to join a channel for the service.
     * @abstract
     * @param {string} the channel to join.
     * @memberOf Service
     */
    public abstract async joinChannel(channel: string): Promise<boolean>;

    /**
     * Call to send a message to a channel for the service.
     * @abstract
     * @param {string} the channel to send the message to.
     * @param {string} the message contents.
     * @memberOf Service
     */
    public abstract async sendMessage(channel: string, message: string): Promise<boolean>;

    /**
     * Called when a message comes from the websocket.
     * @protected
     * @abstract
     * @param {string} rawMessage the message from the websocket.
     * @memberOf Service
     */
    protected abstract async parseMessage(rawMessage: string): Promise<Message>;

    /**
     * Called after a chat message is parsed by the service.
     * @protected
     * @param {Message} the parsed chat message.
     * @memberOf Service
     */
    protected async onMessage(message: Message): Promise<boolean> {
        Logger.bot(this.botName, `(${message.channel}) ${chalk.magenta(message.username)} > ${message.text}`);
        const response = await this.commandHandler.handle(message);
        if (response !== this.commandHandler.defaultResponse) {
            return this.sendMessage(message.channel, response.message);
        } else {
            return false;
        }
    }

    /**
     * Call to send a message to the open websocket.
     * @protected
     * @param {string} message to send to the socket.
     * @memberOf Service
     */
    protected async send(message: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.socket.send(message, (socketError) => {
                resolve(socketError !== undefined)
            });
        });
    }

    /**
     * Called when a message comes from the websocket. Supports line breaks.
     * @private
     * @param {string} the raw message from the websocket.
     * @memberOf Service
     */
    private async parseData(rawMessage: string) {
        if (Utils.contains(rawMessage, "\n")) {
            let messageList = rawMessage.split("\n");
            messageList.forEach(async message => {
                const parsed = await this.parseMessage(message)
                this.verifyAndParseMessage(parsed);
            });
        } else {
            const response = await this.parseMessage(rawMessage);
            this.verifyAndParseMessage(response);
        }
    }

    public async verifyAndParseMessage(message: Message) {
        const event = this.eventMappings[message.eventCode];
        if (event !== undefined) {
            this.parser.pushEvent(event, message);
        }
    }
}
