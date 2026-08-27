import { Router, type IRouter } from "express";
import { eq, desc, gte, sql } from "drizzle-orm";
import { db, transactionsTable, servicesTable } from "@workspace/db";
import {
  ListTransactionsResponse,
  ListTransactionsQueryParams,
  CreateTransactionBody,
  CreateTransactionResponse,
  GetTransactionParams,
  GetTransactionResponse,
  DeleteTransactionParams,
} from "@workspace/api-zod";
import { normaliseRecipient, sendReceiptSms, type SmsStatus } from "../lib/sms";

const router: IRouter = Router();

function formatTx(tx: typeof transactionsTable.$inferSelect) {
  return {
    ...tx,
    servicePrice: parseFloat(tx.servicePrice),
    amountPaid: parseFloat(tx.amountPaid),
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

router.get("/transactions", async (req, res): Promise<void> => {
  const query = ListTransactionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const limit = query.data.limit ?? 50;

  let dbQuery = db
    .select()
    .from(transactionsTable)
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit);

  if (query.data.date) {
    // filter by date (YYYY-MM-DD in local context)
    const dayStart = new Date(`${query.data.date}T00:00:00.000Z`);
    const dayEnd = new Date(`${query.data.date}T23:59:59.999Z`);
    dbQuery = db
      .select()
      .from(transactionsTable)
      .where(
        sql`${transactionsTable.createdAt} >= ${dayStart} AND ${transactionsTable.createdAt} <= ${dayEnd}`,
      )
      .orderBy(desc(transactionsTable.createdAt))
      .limit(limit);
  }

  const transactions = await dbQuery;
  res.json(ListTransactionsResponse.parse(transactions.map(formatTx)));
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.sendSms && (!parsed.data.customerPhone || !normaliseRecipient(parsed.data.customerPhone))) {
    res.status(400).json({ error: "A valid customer phone number with country code is required to send an SMS" });
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

  const receiptNumber = generateReceiptNumber();
  const [tx] = await db
    .insert(transactionsTable)
    .values({
      receiptNumber,
      serviceId: parsed.data.serviceId,
      serviceName: service.name,
      servicePrice: service.price,
      customerName: parsed.data.customerName,
      vehiclePlate: parsed.data.vehiclePlate.toUpperCase(),
      vehicleType: parsed.data.vehicleType ?? "Car",
      amountPaid: String(parsed.data.amountPaid),
      paymentMethod: parsed.data.paymentMethod,
      notes: parsed.data.notes ?? null,
    })
    .returning();

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

  res.status(201).json(CreateTransactionResponse.parse({ ...formatTx(tx), smsStatus }));
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
