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
    console.log(...args);
};
export default log;
/**
 * Logs an error to the console if debug mode is enabled
 * @param args - The arguments to log
 */
const logError = (...args) => {
    if (!DEBUG_MODE)
        return;
    console.error(...args);
};
/**
 * Logs a warning to the console if debug mode is enabled
 * @param args - The arguments to log
 */
const logWarn = (...args) => {
    if (!DEBUG_MODE)
        return;
    console.warn(...args);
};
export { log, logError, logWarn };
