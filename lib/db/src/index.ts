import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Do NOT throw at module load: a missing DATABASE_URL would crash the API
  // before it can listen, making the whole service return 502. Instead we
  // boot anyway and let data queries fail with a clear error at request time.
  console.warn(
    "DATABASE_URL is not set. The API will start, but database-backed routes will fail.",
  );
}

// Railway Postgres requires TLS. Enable SSL when the connection string or
// environment asks for it (sslmode=require / PGSSLMODE=require).
const requireSsl =
  (connectionString
    ? /(^|[?&])sslmode=require/i.test(connectionString)
    : false) ||
  process.env.PGSSLMODE === "require" ||
  process.env.PGSSLMODE === "verify-full" ||
  process.env.PGSSLMODE === "verify-ca" ||
  process.env.PGSSLMODE === "no-verify";

export const pool = new Pool({
  connectionString,
  ...(requireSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  // Fail fast instead of hanging forever on an unreachable database.
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
