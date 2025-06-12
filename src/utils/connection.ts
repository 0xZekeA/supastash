import NetInfo from "@react-native-community/netinfo";

export async function isOnline(): Promise<boolean> {
  if (!NetInfo) return true;
  const networkState = await NetInfo.fetch();
  return !!(networkState.isConnected && networkState.isInternetReachable);
}
