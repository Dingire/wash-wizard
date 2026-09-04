import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, loyaltyTable } from "@workspace/db";
import {
  ListLoyaltyResponse,
  GetLoyaltyParams,
  GetLoyaltyResponse,
} from "@workspace/api-zod";
import { normaliseRecipient } from "../lib/sms";

const router: IRouter = Router();

function formatLoyalty(row: typeof loyaltyTable.$inferSelect) {
  return {
    ...row,
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Leaderboard of customers tracked for the free-wash competition.
router.get("/loyalty", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(loyaltyTable)
    .orderBy(desc(loyaltyTable.freeWashesEarned), desc(loyaltyTable.washCount));
  res.json(ListLoyaltyResponse.parse(rows.map(formatLoyalty)));
});

// Look up a single customer's loyalty progress by phone number.
router.get("/loyalty/:customerId", async (req, res): Promise<void> => {
  const params = GetLoyaltyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const phone = normaliseRecipient(params.data.customerId);
  if (!phone) {
    res.status(400).json({ error: "Invalid phone number" });
    return;
  }
  const [row] = await db
    .select()
    .from(loyaltyTable)
    .where(eq(loyaltyTable.phone, phone));
  if (!row) {
    res.status(404).json({ error: "No loyalty record found for this customer" });
    return;
  }
  res.json(GetLoyaltyResponse.parse(formatLoyalty(row)));
});

export default router;