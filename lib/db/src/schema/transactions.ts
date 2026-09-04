import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { servicesTable } from "./services";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  receiptNumber: text("receipt_number").notNull().unique(),
  serviceId: integer("service_id").notNull().references(() => servicesTable.id),
  serviceName: text("service_name").notNull(),
  servicePrice: numeric("service_price", { precision: 10, scale: 2 }).notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  vehiclePlate: text("vehicle_plate").notNull(),
  vehicleType: text("vehicle_type").notNull().default("Car"),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull().default("Cash"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
