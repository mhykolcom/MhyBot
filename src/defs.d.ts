/**
 * Contains config info about the bot.
 * @interface Config
 */
interface Config {
    mongo: MongoLogin;
    bot: BotLogin;
}

interface BotLogin {
    username: string;
    token: string;
    channel: string;
}

interface MongoLogin {
    url: string;
    databaseName: string;
}

/**
 * Contains info about the specific chat message.
 * @interface Message
 */
interface Message {
    eventCode: string;
    username: string;
    channel: string;
    text: string;
}

/**
 * Someone chatting in a chat with the bot
 */
interface Chatter {
    username: string;
    channel: string;
    interactingBot: string;
}

/**
 * Callback interface. Connected is called when the websocket connection is open.
 * @interface ConnectCallback
 */
interface ConnectCallback {
    connected(): void;
}

/**
 * Response from the command.
 * @interface ICommandResponse
 */
interface CommandResponse {
    message: string;
}
