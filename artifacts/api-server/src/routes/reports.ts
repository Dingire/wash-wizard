import { Router, type IRouter } from "express";
import { gte, lte, sql, and } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import {
  GetReportSummaryResponse,
  GetDailyReportQueryParams,
  GetDailyReportResponse,
  GetWeeklyReportQueryParams,
  GetWeeklyReportResponse,
  GetMonthlyReportQueryParams,
  GetMonthlyReportResponse,
} from "@workspace/api-zod";

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

function startOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}
function endOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999Z`);
}
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function thisWeekMonday(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  return monday.toISOString().slice(0, 10);
}
function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

async function getTxBetween(from: Date, to: Date) {
  return db
    .select()
    .from(transactionsTable)
    .where(
      and(
        gte(transactionsTable.createdAt, from),
        lte(transactionsTable.createdAt, to),
      ),
    );
}

function groupByService(transactions: typeof transactionsTable.$inferSelect[]) {
  const map = new Map<number, { serviceId: number; serviceName: string; totalRevenue: number; transactionCount: number }>();
  for (const tx of transactions) {
    const existing = map.get(tx.serviceId) ?? {
      serviceId: tx.serviceId,
      serviceName: tx.serviceName,
      totalRevenue: 0,
      transactionCount: 0,
    };
    existing.totalRevenue += parseFloat(tx.amountPaid);
    existing.transactionCount += 1;
    map.set(tx.serviceId, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

function groupByDay(transactions: typeof transactionsTable.$inferSelect[]) {
  const map = new Map<string, { date: string; totalRevenue: number; transactionCount: number }>();
  for (const tx of transactions) {
    const date = tx.createdAt.toISOString().slice(0, 10);
    const existing = map.get(date) ?? { date, totalRevenue: 0, transactionCount: 0 };
    existing.totalRevenue += parseFloat(tx.amountPaid);
    existing.transactionCount += 1;
    map.set(date, existing);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

router.get("/reports/summary", async (_req, res): Promise<void> => {
  const today = todayStr();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const weekStart = thisWeekMonday();
  const weekEnd = addDays(weekStart, 6);
  const weekStartDate = startOfDay(weekStart);
  const weekEndDate = endOfDay(weekEnd);

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const monthStart = startOfDay(`${year}-${String(month).padStart(2, "0")}-01`);
  const lastDay = daysInMonth(year, month);
  const monthEnd = endOfDay(`${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`);

  const [todayTxs, weekTxs, monthTxs, recentTxs] = await Promise.all([
    getTxBetween(todayStart, todayEnd),
    getTxBetween(weekStartDate, weekEndDate),
    getTxBetween(monthStart, monthEnd),
    db
      .select()
      .from(transactionsTable)
      .orderBy(sql`${transactionsTable.createdAt} DESC`)
      .limit(10),
  ]);

  const todayRevenue = todayTxs.reduce((sum, t) => sum + parseFloat(t.amountPaid), 0);
  const weekRevenue = weekTxs.reduce((sum, t) => sum + parseFloat(t.amountPaid), 0);
  const monthRevenue = monthTxs.reduce((sum, t) => sum + parseFloat(t.amountPaid), 0);

  // Top services from month
  const topServices = groupByService(monthTxs).slice(0, 5);

  res.json(
    GetReportSummaryResponse.parse({
      todayRevenue,
      todayTransactions: todayTxs.length,
      weekRevenue,
      weekTransactions: weekTxs.length,
      monthRevenue,
      monthTransactions: monthTxs.length,
      recentTransactions: recentTxs.map(formatTx),
      topServices,
    }),
  );
});

router.get("/reports/daily", async (req, res): Promise<void> => {
  const query = GetDailyReportQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const date = query.data.date ?? todayStr();
  const from = startOfDay(date);
  const to = endOfDay(date);

  const transactions = await getTxBetween(from, to);
  const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amountPaid), 0);

  res.json(
    GetDailyReportResponse.parse({
      date,
      totalRevenue,
      transactionCount: transactions.length,
      byService: groupByService(transactions),
      transactions: transactions.map(formatTx),
    }),
  );
});

router.get("/reports/weekly", async (req, res): Promise<void> => {
  const query = GetWeeklyReportQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const weekStart = query.data.weekStart ?? thisWeekMonday();
  const weekEnd = addDays(weekStart, 6);
  const from = startOfDay(weekStart);
  const to = endOfDay(weekEnd);

  const transactions = await getTxBetween(from, to);
  const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amountPaid), 0);

  res.json(
    GetWeeklyReportResponse.parse({
      weekStart,
      weekEnd,
      totalRevenue,
      transactionCount: transactions.length,
      byDay: groupByDay(transactions),
      byService: groupByService(transactions),
    }),
  );
});

router.get("/reports/monthly", async (req, res): Promise<void> => {
  const query = GetMonthlyReportQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const now = new Date();
  const year = query.data.year ?? now.getUTCFullYear();
  const month = query.data.month ?? now.getUTCMonth() + 1;
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const from = startOfDay(`${monthStr}-01`);
  const lastDay = daysInMonth(year, month);
  const to = endOfDay(`${monthStr}-${String(lastDay).padStart(2, "0")}`);

  const transactions = await getTxBetween(from, to);
  const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amountPaid), 0);

  res.json(
    GetMonthlyReportResponse.parse({
      year,
      month,
      totalRevenue,
      transactionCount: transactions.length,
      byDay: groupByDay(transactions),
      byService: groupByService(transactions),
    }),
  );
});

export default router;
