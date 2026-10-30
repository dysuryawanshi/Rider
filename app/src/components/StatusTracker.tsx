import { StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import type { Order } from "@/lib/api";
import { formatTime } from "@/lib/format";
import { palette } from "@/lib/theme";

const STEPS = [
  { key: "acceptedAt", label: "Accepted", icon: "check" },
  { key: "pickedUpAt", label: "Picked up", icon: "shopping" },
  { key: "deliveredAt", label: "Delivered", icon: "home-variant" },
] as const;

/** Hero progress strip for the active order. */
export function StatusTracker({ order }: { order: Order }) {
  const current = STEPS.findIndex((s) => !order[s.key]);
  return (
    <View style={styles.wrap} accessibilityRole="summary" accessibilityLabel={`Progress: ${current === -1 ? 3 : current} of 3 steps`}>
      {STEPS.map((step, i) => {
        const done = Boolean(order[step.key]);
        const next = i === current;
        return (
          <View key={step.key} style={styles.step}>
            <View style={styles.trackRow}>
              <View style={[styles.line, i === 0 && styles.hidden, (done || next) && styles.lineDone]} />
              <View style={[styles.dot, done && styles.dotDone, next && styles.dotNext]}>
                <Icon source={step.icon} size={18} color={done ? "#FFFFFF" : next ? palette.red : "#8D97A5"} />
              </View>
              <View style={[styles.line, i === STEPS.length - 1 && styles.hidden, done && styles.lineDone]} />
            </View>
            <Text variant="labelLarge" style={[styles.label, (done || next) && styles.labelOn]}>
              {step.label}
            </Text>
            <Text variant="labelSmall" style={styles.time}>
              {done ? formatTime(order[step.key]) : next ? "Next" : " "}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", backgroundColor: palette.charcoal, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 8 },
  step: { flex: 1, alignItems: "center" },
  trackRow: { flexDirection: "row", alignItems: "center", alignSelf: "stretch" },
  line: { flex: 1, height: 3, backgroundColor: "#4A5A72" },
  lineDone: { backgroundColor: palette.red },
  hidden: { opacity: 0 },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#33425A",
    borderWidth: 2,
    borderColor: "#4A5A72",
  },
  dotDone: { backgroundColor: palette.red, borderColor: palette.red },
  dotNext: { backgroundColor: "#FFFFFF", borderColor: palette.red },
  label: { color: "#AEB7C4", marginTop: 8 },
  labelOn: { color: "#FFFFFF" },
  time: { color: "#AEB7C4", marginTop: 2 },
});
