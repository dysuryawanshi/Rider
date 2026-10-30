import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Avatar, Button, Card, Text } from "react-native-paper";
import { palette } from "@/lib/theme";

type IconName = string;

export function LoadingState({ label }: { label: string }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator size="large" color={palette.red} />
      <Text variant="titleMedium" style={styles.title}>
        {label}
      </Text>
      {/* Placeholder cards show the shape of what is loading. */}
      <View style={styles.skeletons}>
        {[0, 1].map((i) => (
          <View key={i} style={styles.skeleton}>
            <View style={[styles.bar, { width: "55%" }]} />
            <View style={[styles.bar, { width: "80%" }]} />
            <View style={[styles.bar, { width: "40%" }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  actionIcon = "refresh",
  onAction,
}: {
  icon: IconName;
  title: string;
  body: string;
  actionLabel?: string;
  actionIcon?: IconName;
  onAction?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Avatar.Icon size={72} icon={icon} color={palette.charcoal} style={{ backgroundColor: palette.surfaceMuted }} />
      <Text variant="titleLarge" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={styles.body}>
        {body}
      </Text>
      {actionLabel && onAction ? (
        <Button mode="outlined" icon={actionIcon} onPress={onAction} style={styles.action}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Card mode="contained" style={styles.errorCard}>
        <Card.Content style={styles.errorContent}>
          <Avatar.Icon size={56} icon="wifi-alert" color="#FFFFFF" style={{ backgroundColor: palette.red }} />
          <Text variant="titleMedium" style={styles.title}>
            Couldn't load this screen
          </Text>
          <Text variant="bodyMedium" style={styles.body}>
            {message}
          </Text>
          <Button mode="contained" icon="refresh" onPress={onRetry} style={styles.action}>
            Try again
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  title: { textAlign: "center", marginTop: 12, color: palette.charcoal, fontWeight: "600" },
  body: { textAlign: "center", color: palette.textMuted, maxWidth: 320 },
  action: { marginTop: 16 },
  skeletons: { alignSelf: "stretch", gap: 12, marginTop: 24 },
  skeleton: { backgroundColor: palette.surface, borderRadius: 12, padding: 16, gap: 10 },
  bar: { height: 12, borderRadius: 6, backgroundColor: palette.surfaceMuted },
  errorCard: { alignSelf: "stretch", backgroundColor: palette.redTint },
  errorContent: { alignItems: "center", paddingVertical: 24 },
});
