import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, servicesTable } from "@workspace/db";
import {
  ListServicesResponse,
  CreateServiceBody,
  CreateServiceResponse,
  GetServiceParams,
  GetServiceResponse,
  UpdateServiceParams,
  UpdateServiceBody,
  UpdateServiceResponse,
  DeleteServiceParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const toNumberOrNull = (value: string | null): number | null =>
  value == null ? null : parseFloat(value);

function formatService(service: typeof servicesTable.$inferSelect) {
  return {
    ...service,
    price: parseFloat(service.price),
    priceSuv: toNumberOrNull(service.priceSuv),
    priceTruck: toNumberOrNull(service.priceTruck),
    isActive: service.isActive,
    createdAt: service.createdAt instanceof Date ? service.createdAt.toISOString() : String(service.createdAt),
    updatedAt: service.updatedAt instanceof Date ? service.updatedAt.toISOString() : String(service.updatedAt),
  };
}

router.get("/services", async (_req, res): Promise<void> => {
  const services = await db
    .select()
    .from(servicesTable)
    .orderBy(servicesTable.createdAt);
  res.json(ListServicesResponse.parse(services.map(formatService)));
});

router.post("/services", async (req, res): Promise<void> => {
  const parsed = CreateServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [service] = await db
    .insert(servicesTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? "",
      price: String(parsed.data.price),
      priceSuv: parsed.data.priceSuv != null ? String(parsed.data.priceSuv) : null,
      priceTruck: parsed.data.priceTruck != null ? String(parsed.data.priceTruck) : null,
      isActive: parsed.data.isActive ?? true,
    })
    .returning();
  res.status(201).json(CreateServiceResponse.parse(formatService(service)));
});

router.get("/services/:id", async (req, res): Promise<void> => {
  const params = GetServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [service] = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.id, params.data.id));
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  res.json(GetServiceResponse.parse(formatService(service)));
});

router.patch("/services/:id", async (req, res): Promise<void> => {
  const params = UpdateServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Partial<typeof servicesTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.price !== undefined) updateData.price = String(parsed.data.price);
  if (parsed.data.priceSuv !== undefined) updateData.priceSuv = parsed.data.priceSuv != null ? String(parsed.data.priceSuv) : null;
  if (parsed.data.priceTruck !== undefined) updateData.priceTruck = parsed.data.priceTruck != null ? String(parsed.data.priceTruck) : null;
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;

  const [service] = await db
    .update(servicesTable)
    .set(updateData)
    .where(eq(servicesTable.id, params.data.id))
    .returning();
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  res.json(UpdateServiceResponse.parse(formatService(service)));
});

router.delete("/services/:id", async (req, res): Promise<void> => {
  const params = DeleteServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [service] = await db
    .delete(servicesTable)
    .where(eq(servicesTable.id, params.data.id))
    .returning();
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
