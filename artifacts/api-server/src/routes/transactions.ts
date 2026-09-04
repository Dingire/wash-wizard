import { Router, type IRouter } from "express";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { db, transactionsTable, servicesTable, loyaltyTable } from "@workspace/db";
import {
  ListTransactionsResponse,
  ListTransactionsQueryParams,
  CreateTransactionBody,
  CreateTransactionResponse,
  GetTransactionParams,
  GetTransactionResponse,
  DeleteTransactionParams,
  type LoyaltyRewardFreeWashSmsStatus,
} from "@workspace/api-zod";
import {
  normaliseRecipient,
  sendReceiptSms,
  sendLoyaltyWinSms,
  type SmsStatus,
} from "../lib/sms";

const router: IRouter = Router();

// A customer wins a free wash after this many paid washes ("buy 4, get 1 free").
const FREE_WASH_THRESHOLD = 4;

class ValidationError extends Error {}

function formatTx(tx: typeof transactionsTable.$inferSelect) {
  return {
    ...tx,
    servicePrice: parseFloat(tx.servicePrice),
    amountPaid: parseFloat(tx.amountPaid),
    customerPhone: tx.customerPhone ?? null,
    notes: tx.notes ?? null,
    createdAt: tx.createdAt.toISOString(),
  };
}

function generateReceiptNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MFC-${datePart}-${random}`;
}

type LoyaltyResult = {
  washCount: number;
  freeWashesAvailable: number;
  freeWashEarned: boolean;
  freeWashSmsStatus: SmsStatus;
  redeemedFreeWash: boolean;
};

const noLoyalty: LoyaltyResult = {
  washCount: 0,
  freeWashesAvailable: 0,
  freeWashEarned: false,
  freeWashSmsStatus: "not_requested",
  redeemedFreeWash: false,
};

router.get("/transactions", async (req, res): Promise<void> => {
  const query = ListTransactionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const limit = query.data.limit ?? 50;

  const dateFilter = query.data.date
    ? and(
        gte(transactionsTable.createdAt, new Date(`${query.data.date}T00:00:00.000Z`)),
        lte(transactionsTable.createdAt, new Date(`${query.data.date}T23:59:59.999Z`)),
      )
    : undefined;

  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(dateFilter)
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit);
  res.json(ListTransactionsResponse.parse(transactions.map(formatTx)));
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const smsRecipient = parsed.data.customerPhone ? normaliseRecipient(parsed.data.customerPhone) : null;
  if (parsed.data.sendSms && (!smsRecipient || !/^260\d{9}$/.test(smsRecipient))) {
    res.status(400).json({ error: "A valid Zambian phone number is required (12 digits including country code +260)" });
    return;
  }
  if (parsed.data.redeemFreeWash && !smsRecipient) {
    res.status(400).json({ error: "A customer phone number is required to redeem a free wash" });
    return;
  }

  // Look up service to get name and price snapshot
  const [service] = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.id, parsed.data.serviceId));
  if (!service) {
    res.status(400).json({ error: "Service not found" });
    return;
  }

  // Early check so we can return a clean 400 before doing any writes.
  if (parsed.data.redeemFreeWash && smsRecipient) {
    const [existing] = await db
      .select()
      .from(loyaltyTable)
      .where(eq(loyaltyTable.phone, smsRecipient));
    if (!existing || existing.freeWashesAvailable < 1) {
      res.status(400).json({ error: "This customer does not have a free wash available" });
      return;
    }
  }

  const redeemed = parsed.data.redeemFreeWash;
  const amountPaid = redeemed ? "0" : String(parsed.data.amountPaid);
  const receiptNumber = generateReceiptNumber();

  let loyalty: LoyaltyResult = noLoyalty;

  let tx: typeof transactionsTable.$inferSelect;
  try {
    tx = await db.transaction(async (trx) => {
      if (smsRecipient) {
        // Row-level lock so concurrent requests on the same customer can't
        // double-count washes or award double free washes.
        const [locked] = await trx
          .select()
          .from(loyaltyTable)
          .where(eq(loyaltyTable.phone, smsRecipient))
          .for("update");

        let washCount = locked?.washCount ?? 0;
        let freeWashesAvailable = locked?.freeWashesAvailable ?? 0;
        let freeWashesEarned = locked?.freeWashesEarned ?? 0;
        let freeWashesRedeemed = locked?.freeWashesRedeemed ?? 0;
        let freeWashEarned = false;

        if (redeemed) {
          if (freeWashesAvailable < 1) {
            throw new ValidationError("This customer does not have a free wash available");
          }
          freeWashesAvailable -= 1;
          freeWashesRedeemed += 1;
        } else {
          // Only paid (non-redeemed) washes count toward the reward.
          washCount += 1;
          if (washCount >= FREE_WASH_THRESHOLD) {
            freeWashesAvailable += 1;
            freeWashesEarned += 1;
            washCount = 0;
            freeWashEarned = true;
          }
        }

        await trx
          .insert(loyaltyTable)
          .values({
            phone: smsRecipient,
            customerName: parsed.data.customerName,
            washCount,
            freeWashesAvailable,
            freeWashesEarned,
            freeWashesRedeemed,
          })
          .onConflictDoUpdate({
            target: loyaltyTable.phone,
            set: {
              customerName: parsed.data.customerName,
              washCount,
              freeWashesAvailable,
              freeWashesEarned,
              freeWashesRedeemed,
            },
          });

        loyalty = {
          washCount,
          freeWashesAvailable,
          freeWashEarned,
          freeWashSmsStatus: "not_requested",
          redeemedFreeWash: redeemed,
        };
      }

      const notes = redeemed
        ? parsed.data.notes
          ? `${parsed.data.notes}\nFree wash (loyalty reward)`
          : "Free wash (loyalty reward)"
        : parsed.data.notes ?? null;

      const [createdTx] = await trx
        .insert(transactionsTable)
        .values({
          receiptNumber,
          serviceId: parsed.data.serviceId,
          serviceName: service.name,
          servicePrice: service.price,
          customerName: parsed.data.customerName,
          customerPhone: smsRecipient,
          vehiclePlate: parsed.data.vehiclePlate.toUpperCase(),
          vehicleType: parsed.data.vehicleType ?? "Car",
          amountPaid,
          paymentMethod: parsed.data.paymentMethod,
          notes,
        })
        .returning();

      return createdTx;
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }

  let smsStatus: SmsStatus = "not_requested";
  if (parsed.data.sendSms && parsed.data.customerPhone) {
    smsStatus = await sendReceiptSms({
      recipient: parsed.data.customerPhone,
      customerName: tx.customerName,
      receiptNumber: tx.receiptNumber,
      serviceName: tx.serviceName,
      vehiclePlate: tx.vehiclePlate,
      amountPaid: tx.amountPaid,
    });
  }

  if (loyalty.freeWashEarned && smsRecipient) {
    loyalty.freeWashSmsStatus = await sendLoyaltyWinSms({
      recipient: smsRecipient,
      customerName: tx.customerName,
      washesCompleted: FREE_WASH_THRESHOLD,
    });
  }

  const loyaltyStatus = loyalty.freeWashSmsStatus as LoyaltyRewardFreeWashSmsStatus;
  res.status(201).json(
    CreateTransactionResponse.parse({
      ...formatTx(tx),
      smsStatus,
      loyalty: { ...loyalty, freeWashSmsStatus: loyaltyStatus },
    }),
  );
});

router.get("/transactions/:id", async (req, res): Promise<void> => {
  const params = GetTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [tx] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, params.data.id));
  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json(GetTransactionResponse.parse(formatTx(tx)));
});

router.delete("/transactions/:id", async (req, res): Promise<void> => {
  const params = DeleteTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [tx] = await db
    .delete(transactionsTable)
    .where(eq(transactionsTable.id, params.data.id))
    .returning();
  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;