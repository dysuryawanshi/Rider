import { useState, type ReactNode } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Banner, Button, Snackbar, Text } from "react-native-paper";
import { AppHeader } from "@/components/AppHeader";
import { OrderCard } from "@/components/OrderCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import { api, ApiError, type Order } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { hapticError, hapticSuccess } from "@/lib/feedback";
import { timeAgo } from "@/lib/format";
import { palette } from "@/lib/theme";
import { useResource } from "@/lib/useResource";

type Toast = { kind: "success" | "error"; message: string } | null;

export default function AvailableScreen() {
  const { token, user } = useSession();
  const { state, retry, refresh, setData } = useResource(api.available);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const showToast = (t: NonNullable<Toast>) => {
    setToast(t);
    setToastOpen(true);
  };

  async function accept(order: Order) {
    if (state.kind !== "ready") return;
    setAcceptingId(order.id);
    try {
      await api.act(token, order.id, "accept");
      hapticSuccess();
      setData({ orders: state.data.orders.filter((o) => o.id !== order.id), hasActiveOrder: true });
      showToast({ kind: "success", message: `Accepted ${order.code}. Head to ${order.restaurant.name}.` });
    } catch (err) {
      hapticError();
      showToast({ kind: "error", message: err instanceof ApiError ? err.message : "Couldn't accept this order" });
      void refresh();
    } finally {
      setAcceptingId(null);
    }
  }

  let body: ReactNode;
  if (state.kind === "loading") {
    body = <LoadingState label="Loading available orders…" />;
  } else if (state.kind === "error") {
    body = <ErrorState message={state.message} onRetry={retry} />;
  } else {
    const { orders, hasActiveOrder } = state.data;
    body = (
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={refresh} colors={[palette.red]} />}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Banner
              visible={hasActiveOrder}
              icon="moped"
              actions={[{ label: "Open active order", onPress: () => router.navigate("/active") }]}
              style={styles.banner}
            >
              You're on a delivery. Finish it before accepting another order.
            </Banner>
            {orders.length > 0 ? (
              <Text variant="titleMedium" style={styles.greeting}>
                Hi {user.name.split(" ")[0]}, {orders.length} {orders.length === 1 ? "order is" : "orders are"} waiting for you
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-check-outline"
            title="No new orders"
            body={
              hasActiveOrder
                ? "Nothing new right now. Focus on your active delivery."
                : "When dispatch assigns you an order it shows up here. Pull down to check again."
            }
            actionLabel="Check again"
            onAction={refresh}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            meta={`assigned ${timeAgo(item.assignedAt)}`}
            actions={
              <Button
                mode="contained"
                icon="check"
                onPress={() => accept(item)}
                loading={acceptingId === item.id}
                disabled={hasActiveOrder || acceptingId !== null}
                buttonColor={palette.redDark}
                textColor="#FFFFFF"
                labelStyle={styles.acceptLabel}
                style={styles.accept}
                accessibilityHint={hasActiveOrder ? "Finish your active order first" : undefined}
              >
                {acceptingId === item.id ? "Accepting…" : "Accept order"}
              </Button>
            }
          />
        )}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Available orders" />
      {body}
      <Snackbar
        visible={toastOpen}
        onDismiss={() => setToastOpen(false)}
        duration={4000}
        style={{ backgroundColor: toast?.kind === "error" ? palette.redDark : palette.charcoal }}
        action={toast?.kind === "success" ? { label: "Open", onPress: () => router.navigate("/active") } : undefined}
      >
        {toast?.message ?? ""}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  list: { padding: 16, flexGrow: 1, maxWidth: 640, width: "100%", alignSelf: "center" },
  headerBlock: { gap: 12, marginBottom: 12 },
  banner: { backgroundColor: palette.warningTint, borderRadius: 12 },
  greeting: { color: palette.charcoal, fontWeight: "600" },
  accept: { flex: 1 },
  acceptLabel: { fontSize: 16, fontWeight: "700" },
});
