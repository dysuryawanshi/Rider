export type OrderStatus = "ASSIGNED" | "ACCEPTED" | "PICKED_UP" | "DELIVERED";

export type Order = {
  id: string;
  code: string;
  status: OrderStatus;
  restaurant: { name: string; address: string };
  customer: { firstName: string };
  address: string;
  dropoffNote: string | null;
  items: { id: string; name: string; quantity: number }[];
  payoutCents: number;
  assignedAt: string;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
};

export type Rider = {
  id: string;
  email: string;
  name: string;
  role: "RIDER";
  vehicle: string | null;
};

export type OrderAction = "accept" | "pickup" | "deliver";

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4791").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

type RequestOptions = { method?: "GET" | "POST"; body?: unknown; token?: string | null; signal?: AbortSignal };

export async function request<T>(path: string, { method = "GET", body, token, signal }: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(0, "network_error", `Can't reach the Rider server at ${API_URL}. Check your connection and try again.`);
  }

  const data = (await res.json().catch(() => null)) as { error?: { code: string; message: string } } | null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.error?.code ?? "http_error", data?.error?.message ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  signIn: (email: string, password: string) =>
    request<{ token: string; user: Rider }>("/auth/sign-in", { method: "POST", body: { email, password } }),
  me: (token: string) => request<{ user: Rider }>("/auth/me", { token }),
  available: (token: string, signal?: AbortSignal) =>
    request<{ orders: Order[]; hasActiveOrder: boolean }>("/orders/available", { token, signal }),
  active: (token: string, signal?: AbortSignal) => request<{ order: Order | null }>("/orders/active", { token, signal }),
  history: (token: string, signal?: AbortSignal) =>
    request<{ orders: Order[]; summary: { deliveredCount: number; earningsCents: number } }>("/orders/history", {
      token,
      signal,
    }),
  act: (token: string, id: string, action: OrderAction) =>
    request<{ order: Order }>(`/orders/${encodeURIComponent(id)}/${action}`, { method: "POST", token }),
};
