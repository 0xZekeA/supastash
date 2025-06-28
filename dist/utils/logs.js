import { getSupastashConfig } from "../core/config";
const DEBUG_MODE = __DEV__; // Log only in dev mode
/**
 * Logs a message to the console if debug mode is enabled
 * @param args - The arguments to log
 */
const log = (...args) => {
    const config = getSupastashConfig();
    if (!DEBUG_MODE || !config.debugMode)
        return;
    if (typeof console !== "undefined" && console.log) {
        Function.prototype.apply.call(console.log, console, args);
    }
};
export default log;
/**
 * Logs an error to the console if debug mode is enabled
 * @param args - The arguments to log
 */
const logError = (...args) => {
    if (!DEBUG_MODE)
        return;
    if (typeof console !== "undefined" && console.error) {
        Function.prototype.apply.call(console.error, console, args);
    }
};
const logWarn = (...args) => {
    if (!DEBUG_MODE)
        return;
    if (typeof console !== "undefined" && console.warn) {
        Function.prototype.apply.call(console.warn, console, args);
    }
};
export { log, logError, logWarn };
