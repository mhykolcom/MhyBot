import { BaseCommand } from "..";

/**
 * Test command that tests if the bot is up
 * @export
 * @class PingCommand
 */
export class PingCommand implements BaseCommand {

    /**
     * Execute the command
     * @public
     * @async
     * @returns {CommandResponse}
     * @memberOf PingCommand
     */
    public async execute(message: Message, args: String[]): Promise<CommandResponse> {
        return { message: "Pong" };
    }
}
