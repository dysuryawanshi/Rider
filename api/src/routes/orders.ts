import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError } from "../http.js";
import { requireAuth, requireRole } from "../auth.js";
import { ACTIVE_STATUSES, TRANSITIONS, orderInclude, serializeOrder, type TransitionName } from "../orders.js";

const OrderParams = z.object({ id: z.string().min(1).max(64) });
const HistoryQuery = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) });

export function ordersRouter(secret: string): Router {
  const router = Router();
  router.use(requireAuth(secret), requireRole("RIDER"));

  // Orders assigned to this rider that are waiting to be accepted.
  router.get("/available", async (req, res) => {
    const riderId = req.user!.id;
    const [orders, activeCount] = await Promise.all([
      prisma.order.findMany({
        where: { riderId, status: "ASSIGNED" },
        include: orderInclude,
        orderBy: { assignedAt: "asc" },
      }),
      prisma.order.count({ where: { riderId, status: { in: ACTIVE_STATUSES } } }),
    ]);
    res.json({ orders: orders.map(serializeOrder), hasActiveOrder: activeCount > 0 });
  });

  router.get("/active", async (req, res) => {
    const order = await prisma.order.findFirst({
      where: { riderId: req.user!.id, status: { in: ACTIVE_STATUSES } },
      include: orderInclude,
      orderBy: { acceptedAt: "desc" },
    });
    res.json({ order: order ? serializeOrder(order) : null });
  });

  router.get("/history", async (req, res) => {
    const { limit } = HistoryQuery.parse(req.query);
    const where = { riderId: req.user!.id, status: "DELIVERED" as const };
    const [orders, totals] = await Promise.all([
      prisma.order.findMany({ where, include: orderInclude, orderBy: { deliveredAt: "desc" }, take: limit }),
      prisma.order.aggregate({ where, _count: { _all: true }, _sum: { payoutCents: true } }),
    ]);
    res.json({
      orders: orders.map(serializeOrder),
      summary: { deliveredCount: totals._count._all, earningsCents: totals._sum.payoutCents ?? 0 },
    });
  });

  const transition = (name: TransitionName) =>
    router.post(`/:id/${name}`, async (req, res) => {
      const { id } = OrderParams.parse(req.params);
      const riderId = req.user!.id;
      const rule = TRANSITIONS[name];

      const updated = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id } });
        if (!order) throw new HttpError(404, "not_found", "Order not found");
        if (order.riderId !== riderId) {
          throw new HttpError(403, "forbidden", "This order is assigned to another rider");
        }
        if (order.status !== rule.from) {
          throw new HttpError(409, "invalid_status", `Order is ${order.status.toLowerCase().replace("_", " ")}`);
        }
        if (name === "accept") {
          const active = await tx.order.count({ where: { riderId, status: { in: ACTIVE_STATUSES } } });
          if (active > 0) {
            throw new HttpError(409, "active_order_exists", "Finish your active order before accepting another");
          }
        }
        // Conditional update guards against a concurrent request changing the status first.
        const result = await tx.order.updateMany({
          where: { id, riderId, status: rule.from },
          data: { status: rule.to, [rule.stamp]: new Date() },
        });
        if (result.count !== 1) throw new HttpError(409, "invalid_status", "Order changed. Refresh and try again");
        return tx.order.findUniqueOrThrow({ where: { id }, include: orderInclude });
      });

      res.json({ order: serializeOrder(updated) });
    });

  transition("accept");
  transition("pickup");
  transition("deliver");

  return router;
}
