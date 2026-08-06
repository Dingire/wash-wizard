import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;

// Railway Postgres requires TLS. Enable SSL when the connection string or
// environment asks for it (sslmode=require / PGSSLMODE=require).
const requireSsl =
  /(^|[?&])sslmode=require/i.test(connectionString) ||
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
