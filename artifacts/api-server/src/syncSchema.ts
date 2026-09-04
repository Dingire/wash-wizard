import { pool } from "@workspace/db";
import { logger } from "./lib/logger";

// Idempotent schema sync. Runs at startup so a fresh database is usable
// without manually running `drizzle-kit push`.
const statements = [
  `CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    receipt_number TEXT NOT NULL UNIQUE,
    service_id INTEGER NOT NULL REFERENCES services(id),
    service_name TEXT NOT NULL,
    service_price NUMERIC(10, 2) NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    vehicle_plate TEXT NOT NULL,
    vehicle_type TEXT NOT NULL DEFAULT 'Car',
    amount_paid NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'Cash',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS customer_phone TEXT`,
  `CREATE TABLE IF NOT EXISTS loyalty (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    wash_count INTEGER NOT NULL DEFAULT 0,
    free_washes_available INTEGER NOT NULL DEFAULT 0,
    free_washes_earned INTEGER NOT NULL DEFAULT 0,
    free_washes_redeemed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
];

export async function syncSchema(): Promise<void> {
  const client = await pool.connect();
  try {
    for (const sql of statements) {
      await client.query(sql);
    }
    logger.info("Database schema is up to date");
  } finally {
    client.release();
  }
}
