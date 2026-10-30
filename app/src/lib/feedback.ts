import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export function hapticSuccess() {
  if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}

export function hapticError() {
  if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
}
