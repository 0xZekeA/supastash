import { getSupastashConfig } from "@/core/config";

const DEBUG_MODE = __DEV__; // Log only in dev mode

/**
 * Logs a message to the console if debug mode is enabled
 * @param args - The arguments to log
 */
const log = (...args: any[]) => {
  const config = getSupastashConfig();
  if (!DEBUG_MODE || !config.debugMode) return;
  if (typeof console !== "undefined" && console.log) {
    Function.prototype.apply.call(console.log, console, args);
  }
};

export default log;
