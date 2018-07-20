import { PingCommand } from "./commands/ping";

/**
 * Base command that all other commands extend.
 * @export
 * @class BaseCommand
 */
export abstract class BaseCommand {

    /**
     * Execute the command
     * @protected
     * @abstract
     * @returns {ICommandResponse}
     * @memberOf BaseCommand
     */
    public abstract async execute(message: Message, args: String[]): Promise<CommandResponse>;
}

/**
 * Handle commands
 * @export
 * @class CommandHandler
 */
export class CommandHandler {

    public defaultResponse: CommandResponse = { message: "Not a command!" };
    private notFoundResponse: CommandResponse = { message: "Command not found!" };

    public commands: Map<string, BaseCommand> = new Map([["ping", new PingCommand()]]);

    /**
     * Attempt to run command from message.
     * @param {string} message
     * @returns {Promise<ICommandResponse>}
     * @memberOf CommandHandler
     */
    public async handle(message: Message): Promise<CommandResponse> {
        if (message.text.startsWith("!") && message.text[1] !== " " && message.text !== "!") {
            const messageSplit = message.text.split(" ");
            const command = messageSplit[0].substring(1).toLowerCase();
            // Make sure the command exists before we continue
            if (this.commands.has(command)) {
                return this.commands.get(command).execute(message, messageSplit.slice(0, messageSplit.length));
            } else {
                return this.notFoundResponse;
            }
        }
        return this.defaultResponse;
    }
}
