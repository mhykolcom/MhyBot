/**
 * General utilities class.
 * @export
 * @class Utils
 */
export class Utils {

    /**
     * Check if a string contains another string.
     * @static
     * @param {string} text to check.
     * @param {string} string to see if it is in the text.
     * @returns {boolean} contains the specified text.
     * @memberOf Utils
     */
    public static contains(text: string, contains: string): boolean {
        return text.indexOf(contains) >= 0;
    }
}
