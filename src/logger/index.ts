import chalk = require("chalk");
import dateFormat = require("dateformat");

/**
 * Formatted logger.
 * @export
 * @class Logger
 */
export class Logger {

    private static isDebug = true;

    /**
     * Log bot message with green info prefix and timestamp.
     * @static
     * @param {string} message to log.
     * @memberOf Logger
     */
    public static bot(botName: string, message: string) {
        this.message(chalk.blue(`${botName}: `), message);
    }

    /**
     * Log message with green info prefix and timestamp.
     * @static
     * @param {string} message to log.
     * @memberOf Logger
     */
    public static log(message: string) {
        this.message(chalk.green("INFO: "), message);
    }

    /**
     * Log message with yellow warn prefix and timestamp.
     * @static
     * @param {string} message to log.
     * @memberOf Logger
     */
    public static warn(message: string) {
        this.message(chalk.yellow("WARN: "), message);
    }

    /**
     * Log message with red error prefix and timestamp.
     * @static
     * @param {string} message to log.
     * @memberOf Logger
     */
    public static error(message: string) {
        this.message(chalk.red("ERROR: "), message);
    }

    /**
     * Log message with blue debug prefix and timestamp.
     * @static
     * @param {string} message to log.
     * @memberOf Logger
     */
    public static debug(message: string) {
        if (this.isDebug) {
            this.message(chalk.cyan("DEBUG: "), message);
        }
    }

    /**
     * Logs to console with specified prefix and message.
     * @private
     * @static
     * @param {string} prefix text.
     * @param {string} message to log.
     * @memberOf Logger
     */
    private static message(prefix: string, message: string) {
        console.log(this.getTime() + prefix + chalk.white(message));
    }

    /**
     * Formats the current time to a nice readable format.
     * @private
     * @static
     * @returns {string} formatted time.
     * @memberOf Logger
     */
    private static getTime(): string {
        let time = dateFormat(new Date(), "HH:MM:ss:l");
        return `[${chalk.grey(time)}] `;
    }
}
