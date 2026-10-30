import type { Order, OrderItem, OrderStatus, Prisma } from "@prisma/client";

export const ACTIVE_STATUSES: OrderStatus[] = ["ACCEPTED", "PICKED_UP"];

export const orderInclude = {
  items: { orderBy: { name: "asc" } },
} satisfies Prisma.OrderInclude;

type OrderWithItems = Order & { items: OrderItem[] };

export function serializeOrder(order: OrderWithItems) {
  return {
    id: order.id,
    code: order.code,
    status: order.status,
    restaurant: { name: order.restaurantName, address: order.restaurantAddress },
    customer: { firstName: order.customerFirstName },
    address: order.address,
    dropoffNote: order.dropoffNote,
    items: order.items.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity })),
    payoutCents: order.payoutCents,
    assignedAt: order.assignedAt.toISOString(),
    acceptedAt: order.acceptedAt?.toISOString() ?? null,
    pickedUpAt: order.pickedUpAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
  };
}

/** Allowed status moves: the action name maps to the status it requires and the status it sets. */
export const TRANSITIONS = {
  accept: { from: "ASSIGNED", to: "ACCEPTED", stamp: "acceptedAt" },
  pickup: { from: "ACCEPTED", to: "PICKED_UP", stamp: "pickedUpAt" },
  deliver: { from: "PICKED_UP", to: "DELIVERED", stamp: "deliveredAt" },
} as const satisfies Record<string, { from: OrderStatus; to: OrderStatus; stamp: keyof Order }>;

export type TransitionName = keyof typeof TRANSITIONS;
