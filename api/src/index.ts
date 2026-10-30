import { existsSync } from "node:fs";
import { createApp } from "./app.js";
import { prisma } from "./db.js";
import { loadEnv } from "./env.js";

if (existsSync(".env")) process.loadEnvFile(".env");

const env = loadEnv();
const app = createApp(env);

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Rider API listening on http://0.0.0.0:${env.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
