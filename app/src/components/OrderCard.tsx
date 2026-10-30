import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Card, Chip, Divider, Icon, Text } from "react-native-paper";
import type { Order } from "@/lib/api";
import { STATUS_LABEL, formatMoney, itemCount } from "@/lib/format";
import { palette } from "@/lib/theme";

function Row({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <View style={styles.row} accessibilityLabel={label}>
      <Icon source={icon} size={20} color={palette.textMuted} />
      <View style={styles.rowBody}>{children}</View>
    </View>
  );
}

export function OrderCard({ order, meta, actions }: { order: Order; meta?: string; actions?: ReactNode }) {
  const done = order.status === "DELIVERED";
  return (
    <Card mode="elevated" style={styles.card} accessibilityLabel={`Order ${order.code} from ${order.restaurant.name}`}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="labelMedium" style={styles.code}>
              {order.code}
              {meta ? ` · ${meta}` : ""}
            </Text>
            <Text variant="titleMedium" style={styles.restaurant}>
              {order.restaurant.name}
            </Text>
          </View>
          <Chip
            compact
            style={{ backgroundColor: done ? palette.successTint : palette.redTint }}
            textStyle={{ color: done ? palette.success : palette.redDark, fontWeight: "600" }}
          >
            {STATUS_LABEL[order.status]}
          </Chip>
        </View>

        <Row icon="storefront-outline" label="Pickup">
          <Text variant="bodyMedium">{order.restaurant.address}</Text>
        </Row>
        <Row icon="map-marker-outline" label="Drop-off">
          <Text variant="bodyMedium">
            <Text style={styles.strong}>{order.customer.firstName}</Text> · {order.address}
          </Text>
          {order.dropoffNote ? (
            <Text variant="bodySmall" style={styles.note}>
              “{order.dropoffNote}”
            </Text>
          ) : null}
        </Row>

        <Divider style={styles.divider} />

        <Row icon="shopping-outline" label="Items">
          {order.items.map((item) => (
            <Text key={item.id} variant="bodyMedium">
              {item.quantity} × {item.name}
            </Text>
          ))}
        </Row>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.muted}>
            {itemCount(order.items)} items
          </Text>
          <Text variant="titleSmall" style={styles.payout}>
            {done ? "Earned" : "Payout"} {formatMoney(order.payoutCents)}
          </Text>
        </View>
      </Card.Content>
      {actions ? <Card.Actions style={styles.actions}>{actions}</Card.Actions> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface },
  content: { gap: 10 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  code: { color: palette.textMuted, letterSpacing: 0.5 },
  restaurant: { color: palette.charcoal, fontWeight: "700" },
  row: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  rowBody: { flex: 1, gap: 2 },
  strong: { fontWeight: "700" },
  note: { color: palette.textMuted, fontStyle: "italic" },
  divider: { marginVertical: 2 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  muted: { color: palette.textMuted },
  payout: { color: palette.charcoal, fontWeight: "700" },
  actions: { paddingHorizontal: 16, paddingBottom: 16 },
});
