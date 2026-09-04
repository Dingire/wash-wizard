import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loyaltyTable = pgTable("loyalty", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  customerName: text("customer_name").notNull(),
  washCount: integer("wash_count").notNull().default(0),
  freeWashesAvailable: integer("free_washes_available").notNull().default(0),
  freeWashesEarned: integer("free_washes_earned").notNull().default(0),
  freeWashesRedeemed: integer("free_washes_redeemed").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLoyaltySchema = createInsertSchema(loyaltyTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLoyalty = z.infer<typeof insertLoyaltySchema>;
export type Loyalty = typeof loyaltyTable.$inferSelect;