import { getSupastashConfig } from "../core/config";
export async function isOnline() {
    const config = getSupastashConfig();
    if (config.networkAdapter)
        return (await config.networkAdapter.fetch()).isConnected ?? false;
    if (typeof navigator !== "undefined")
        return navigator.onLine;
    return true;
}
export function isNetworkError(err) {
    if (!err)
        return false;
    if (err.message === "Failed to fetch")
        return true;
    if (err.message?.includes("Network request failed"))
        return true;
    if (err.message?.includes("NetworkError"))
        return true;
    if (err.message?.includes("timeout"))
        return true;
    if (err.__isOffline === true)
        return true;
    const hasPgCode = typeof err.code === "string" && err.code.length > 0;
    if (!hasPgCode)
        return true;
    return false;
}
