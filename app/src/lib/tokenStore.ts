import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const KEY = "rider.session";

// SecureStore is native-only; the web build keeps the session in localStorage.
export const tokenStore = {
  async get(): Promise<string | null> {
    if (Platform.OS === "web") return globalThis.localStorage?.getItem(KEY) ?? null;
    return SecureStore.getItemAsync(KEY);
  },
  async set(value: string): Promise<void> {
    if (Platform.OS === "web") return void globalThis.localStorage?.setItem(KEY, value);
    await SecureStore.setItemAsync(KEY, value);
  },
  async clear(): Promise<void> {
    if (Platform.OS === "web") return void globalThis.localStorage?.removeItem(KEY);
    await SecureStore.deleteItemAsync(KEY);
  },
};
