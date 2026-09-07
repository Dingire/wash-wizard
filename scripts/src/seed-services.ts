import { eq } from "drizzle-orm";
import { db, servicesTable, pool } from "@workspace/db";

type SeedService = {
  name: string;
  description: string;
  price: number;
  priceSuv: number;
  priceTruck: number;
};

// Prices are per vehicle tier: small car / SUV & 4x4 / truck & bus (K).
const services: SeedService[] = [
  { name: "Exterior Wash", description: "Exterior wash", price: 50, priceSuv: 70, priceTruck: 100 },
  { name: "Interior Wash", description: "Interior wash", price: 60, priceSuv: 80, priceTruck: 110 },
  { name: "Full Wash", description: "Inside & outside wash", price: 80, priceSuv: 100, priceTruck: 150 },
  { name: "Engine Wash", description: "Engine bay degrease and clean", price: 70, priceSuv: 80, priceTruck: 160 },
  {
    name: "Polishing with 1-2 Years Paint Protection",
    description: "Machine polish with 1-2 years paint protection",
    price: 1500,
    priceSuv: 2000,
    priceTruck: 2500,
  },
  { name: "Full Valet & Steaming", description: "Full valet and steam clean", price: 800, priceSuv: 1200, priceTruck: 1500 },
  { name: "Seat Cover Installation", description: "Seat cover fitting", price: 50, priceSuv: 60, priceTruck: 80 },
  { name: "Dashboard Polish", description: "Dashboard dressing and polish", price: 150, priceSuv: 150, priceTruck: 200 },
  { name: "Rim Cleaning", description: "Rim deep cleaning", price: 300, priceSuv: 300, priceTruck: 400 },
  { name: "Roof Lining Cleaning", description: "Roof lining wash and clean", price: 80, priceSuv: 100, priceTruck: 200 },
];

async function main(): Promise<void> {
  let created = 0;
  let updated = 0;
  for (const service of services) {
    const [existing] = await db
      .select()
      .from(servicesTable)
      .where(eq(servicesTable.name, service.name))
      .limit(1);

    const values = {
      description: service.description,
      price: String(service.price),
      priceSuv: String(service.priceSuv),
      priceTruck: String(service.priceTruck),
    };

    if (existing) {
      await db
        .update(servicesTable)
        .set(values)
        .where(eq(servicesTable.id, existing.id));
      updated += 1;
    } else {
      await db.insert(servicesTable).values({ name: service.name, ...values });
      created += 1;
    }
  }
  console.log(`Services seeded: ${created} created, ${updated} updated.`);
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});