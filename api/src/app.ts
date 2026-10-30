import express from "express";
import cors from "cors";
import { prisma } from "./db.js";
import type { Env } from "./env.js";
import { errorHandler, notFound } from "./http.js";
import { authRouter } from "./routes/auth.js";
import { ordersRouter } from "./routes/orders.js";

export function createApp(env: Env) {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    }),
  );
  app.use(express.json({ limit: "32kb" }));

  app.get("/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ok", database: "up", time: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: "degraded", database: "down", time: new Date().toISOString() });
    }
  });

  app.use("/auth", authRouter(env.JWT_SECRET));
  app.use("/orders", ordersRouter(env.JWT_SECRET));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
