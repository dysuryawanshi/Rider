/**
 * Development-only PostgreSQL. Downloads real Postgres binaries via `embedded-postgres`
 * and runs them on port 55491 with data in ./.pgdata. Use any other PostgreSQL by setting DATABASE_URL instead.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const dataDir = path.resolve(".pgdata");
const firstRun = !existsSync(path.join(dataDir, "PG_VERSION"));

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "rider",
  password: "rider",
  port: 55491,
  persistent: true,
});

async function main() {
  if (firstRun) await pg.initialise();
  await pg.start();
  if (firstRun) await pg.createDatabase("rider");
  console.log("PostgreSQL ready at postgresql://rider:rider@localhost:55491/rider (Ctrl+C to stop)");
}

async function stop() {
  await pg.stop();
  process.exit(0);
}

process.on("SIGINT", () => void stop());
process.on("SIGTERM", () => void stop());

main().catch(async (err) => {
  console.error(err);
  await pg.stop().catch(() => undefined);
  process.exit(1);
});
