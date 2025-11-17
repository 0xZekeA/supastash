import NetInfo from "@react-native-community/netinfo";

export async function isOnline(): Promise<boolean> {
  if (!NetInfo) return true;
  const networkState = await NetInfo.fetch();
  if (!networkState.isConnected) return false;
  return true;
}

export function isNetworkError(err: any): boolean {
  if (!err) return false;

  if (err.message === "Failed to fetch") return true;
  if (err.message?.includes("Network request failed")) return true;

  if (err.message?.includes("NetworkError")) return true;
  if (err.message?.includes("timeout")) return true;

  if (err.__isOffline === true) return true;

  const hasPgCode = typeof err.code === "string" && err.code.length > 0;
  if (!hasPgCode) return true;

  return false;
}
