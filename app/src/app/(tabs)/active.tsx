import { useCallback, useState, type ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Avatar, Button, Card, Dialog, Portal, Snackbar, Text } from "react-native-paper";
import { AppHeader } from "@/components/AppHeader";
import { OrderCard } from "@/components/OrderCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import { StatusTracker } from "@/components/StatusTracker";
import { api, ApiError, type Order } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { hapticError, hapticSuccess } from "@/lib/feedback";
import { formatMoney } from "@/lib/format";
import { palette } from "@/lib/theme";
import { useResource } from "@/lib/useResource";

type Toast = { kind: "success" | "error"; message: string } | null;

export default function ActiveScreen() {
  const { token } = useSession();
  const { state, retry, refresh, setData } = useResource(api.active);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeliver, setConfirmDeliver] = useState(false);
  const [delivered, setDelivered] = useState<Order | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const showToast = (t: NonNullable<Toast>) => {
    setToast(t);
    setToastOpen(true);
  };

  // The delivered confirmation is shown once; leaving the tab dismisses it.
  useFocusEffect(useCallback(() => () => setDelivered(null), []));

  async function advance(order: Order) {
    const action = order.status === "ACCEPTED" ? "pickup" : "deliver";
    setConfirmDeliver(false);
    setSubmitting(true);
    try {
      const { order: updated } = await api.act(token, order.id, action);
      hapticSuccess();
      if (action === "deliver") {
        setToastOpen(false);
        setDelivered(updated);
        setData({ order: null });
      } else {
        setData({ order: updated });
        showToast({ kind: "success", message: `Picked up from ${updated.restaurant.name}. Head to ${updated.customer.firstName}.` });
      }
    } catch (err) {
      hapticError();
      showToast({ kind: "error", message: err instanceof ApiError ? err.message : "Couldn't update this order" });
      void refresh();
    } finally {
      setSubmitting(false);
    }
  }

  let body: ReactNode;
  if (delivered) {
    body = (
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card mode="contained" style={styles.successCard} accessibilityLiveRegion="polite">
          <Card.Content style={styles.successContent}>
            <Avatar.Icon size={80} icon="check-decagram" color="#FFFFFF" style={{ backgroundColor: palette.success }} />
            <Text variant="headlineSmall" style={styles.successTitle}>
              Delivered to {delivered.customer.firstName}
            </Text>
            <Text variant="bodyLarge" style={styles.muted}>
              {delivered.code} from {delivered.restaurant.name}
            </Text>
            <Text variant="titleLarge" style={styles.earned}>
              +{formatMoney(delivered.payoutCents)} earned
            </Text>
            <View style={styles.successActions}>
              <Button
                mode="contained"
                icon="clipboard-list-outline"
                onPress={() => {
                  setDelivered(null);
                  router.navigate("/");
                }}
              >
                Find next order
              </Button>
              <Button
                mode="outlined"
                icon="history"
                onPress={() => {
                  setDelivered(null);
                  router.navigate("/history");
                }}
              >
                View history
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  } else if (state.kind === "loading") {
    body = <LoadingState label="Loading your active order…" />;
  } else if (state.kind === "error") {
    body = <ErrorState message={state.message} onRetry={retry} />;
  } else if (!state.data.order) {
    body = (
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={refresh} colors={[palette.red]} />}
      >
        <EmptyState
          icon="moped-outline"
          title="No active delivery"
          body="Accept an order from the Available tab and it will appear here with pickup and drop-off steps."
          actionLabel="See available orders"
          actionIcon="clipboard-list-outline"
          onAction={() => router.navigate("/")}
        />
      </ScrollView>
    );
  } else {
    const order = state.data.order;
    const pickingUp = order.status === "ACCEPTED";
    body = (
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={refresh} colors={[palette.red]} />}
      >
        <StatusTracker order={order} />
        <Card mode="contained" style={styles.nextStep}>
          <Card.Content style={{ gap: 4 }}>
            <Text variant="labelLarge" style={styles.nextLabel}>
              NEXT STEP
            </Text>
            <Text variant="titleMedium" style={styles.nextTitle}>
              {pickingUp
                ? `Collect the order at ${order.restaurant.name}`
                : `Deliver to ${order.customer.firstName} at ${order.address}`}
            </Text>
          </Card.Content>
        </Card>
        <OrderCard order={order} />
        <Button
          mode="contained"
          icon={pickingUp ? "shopping" : "package-variant-closed-check"}
          onPress={() => (pickingUp ? advance(order) : setConfirmDeliver(true))}
          loading={submitting}
          disabled={submitting}
          buttonColor={palette.redDark}
          textColor="#FFFFFF"
          contentStyle={styles.cta}
          labelStyle={styles.ctaLabel}
        >
          {submitting ? "Updating…" : pickingUp ? "Mark picked up" : "Mark delivered"}
        </Button>

        <Portal>
          <Dialog visible={confirmDeliver} onDismiss={() => setConfirmDeliver(false)}>
            <Dialog.Icon icon="package-variant-closed-check" color={palette.red} />
            <Dialog.Title style={{ textAlign: "center" }}>Mark as delivered?</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">
                Confirm you handed {order.code} to {order.customer.firstName}. This can't be undone.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setConfirmDeliver(false)}>Cancel</Button>
              <Button mode="contained" onPress={() => advance(order)}>
                Yes, delivered
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Active order" />
      {body}
      <Snackbar
        visible={toastOpen}
        onDismiss={() => setToastOpen(false)}
        duration={4000}
        style={{ backgroundColor: toast?.kind === "error" ? palette.redDark : palette.charcoal }}
      >
        {toast?.message ?? ""}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  scroll: { padding: 16, gap: 16, flexGrow: 1, maxWidth: 640, width: "100%", alignSelf: "center" },
  nextStep: { backgroundColor: palette.redTint },
  nextLabel: { color: palette.redDark, letterSpacing: 1 },
  nextTitle: { color: palette.charcoal, fontWeight: "700" },
  cta: { paddingVertical: 8 },
  ctaLabel: { fontSize: 17, fontWeight: "700" },
  successCard: { backgroundColor: palette.successTint },
  successContent: { alignItems: "center", gap: 10, paddingVertical: 32 },
  successTitle: { color: palette.charcoal, fontWeight: "700", textAlign: "center" },
  muted: { color: palette.textMuted, textAlign: "center" },
  earned: { color: palette.success, fontWeight: "800" },
  successActions: { gap: 10, marginTop: 12, alignSelf: "stretch" },
});
