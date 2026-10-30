import type { OrderStatus } from "./api";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function formatMoney(cents: number): string {
  return money.format(cents / 100);
}

export function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const day = sameDay ? "Today" : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return `${day}, ${formatTime(iso)}`;
}

export function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  return `${hours} h ago`;
}

export function itemCount(items: { quantity: number }[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  ASSIGNED: "New",
  ACCEPTED: "Heading to restaurant",
  PICKED_UP: "On the way",
  DELIVERED: "Delivered",
};
