import { useState, type ReactNode } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { Snackbar, Text } from "react-native-paper";
import { AppHeader } from "@/components/AppHeader";
import { OrderCard } from "@/components/OrderCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import { api } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import { palette } from "@/lib/theme";
import { useResource } from "@/lib/useResource";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="headlineSmall" style={styles.statValue}>
        {value}
      </Text>
      <Text variant="labelMedium" style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

export default function HistoryScreen() {
  const { state, retry, refresh } = useResource(api.history);
  const [toastOpen, setToastOpen] = useState(false);

  async function pullToRefresh() {
    if (await refresh()) setToastOpen(true);
  }

  let body: ReactNode;
  if (state.kind === "loading") {
    body = <LoadingState label="Loading your deliveries…" />;
  } else if (state.kind === "error") {
    body = <ErrorState message={state.message} onRetry={retry} />;
  } else {
    const { orders, summary } = state.data;
    body = (
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={pullToRefresh} colors={[palette.red]} />}
        ListHeaderComponent={
          orders.length > 0 ? (
            <View style={styles.summary} accessibilityRole="summary">
              <Stat label="Deliveries" value={String(summary.deliveredCount)} />
              <View style={styles.statDivider} />
              <Stat label="Earned" value={formatMoney(summary.earningsCents)} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="history"
            title="No deliveries yet"
            body="Orders you deliver show up here with your earnings."
            actionLabel="Refresh"
            onAction={pullToRefresh}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => <OrderCard order={item} meta={formatDateTime(item.deliveredAt)} />}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Delivered" />
      {body}
      <Snackbar
        visible={toastOpen}
        onDismiss={() => setToastOpen(false)}
        duration={2500}
        style={{ backgroundColor: palette.charcoal }}
      >
        History is up to date
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  list: { padding: 16, flexGrow: 1, maxWidth: 640, width: "100%", alignSelf: "center" },
  summary: {
    flexDirection: "row",
    backgroundColor: palette.charcoal,
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 16,
    borderLeftWidth: 6,
    borderLeftColor: palette.red,
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { color: "#FFFFFF", fontWeight: "800" },
  statLabel: { color: "#AEB7C4", letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: "#4A5A72" },
});
