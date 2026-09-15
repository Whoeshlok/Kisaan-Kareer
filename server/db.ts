import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  alerts,
  chatMessages,
  crops,
  diseaseScans,
  farms,
  marketPrices,
  recommendations,
  soilTests,
  users,
  weatherSnapshots,
  treatmentHistory,
  irrigationHistory,
  InsertFarm,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: typeof users.$inferInsert): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  await db.insert(users).values(user).onDuplicateKeyUpdate({
    set: { name: user.name, email: user.email, loginMethod: user.loginMethod, lastSignedIn: new Date() },
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function createLocalUser(input: { openId: string; name: string; email: string; passwordHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(users).values({ ...input, loginMethod: "email" });
  return getUserByOpenId(input.openId);
}

export const demoFarm = {
  id: 0, ownerOpenId: "demo-sneha", farmerName: "Sneha Sharma", location: "Meerut, Uttar Pradesh",
  district: "Meerut", state: "Uttar Pradesh", latitude: "28.9845", longitude: "77.7064",
  farmSizeAcres: "4.5", language: "English · Hindi", irrigationMethod: "Tube well", farmingPreference: "Conventional",
};

export async function getFarmsByOwner(ownerOpenId: string) {
  const db = await getDb();
  if (!db) return [{ ...demoFarm, ownerOpenId }];
  return db.select().from(farms).where(eq(farms.ownerOpenId, ownerOpenId)).orderBy(asc(farms.createdAt));
}

export async function getFarmByOwner(ownerOpenId: string) {
  const farmsForOwner = await getFarmsByOwner(ownerOpenId);
  return farmsForOwner[0] ?? { ...demoFarm, ownerOpenId };
}

export async function getFarmById(ownerOpenId: string, farmId: number) {
  const db = await getDb();
  if (!db || !farmId) return getFarmByOwner(ownerOpenId);
  const result = await db.select().from(farms).where(and(eq(farms.id, farmId), eq(farms.ownerOpenId, ownerOpenId))).limit(1);
  return result[0] ?? getFarmByOwner(ownerOpenId);
}

export async function upsertFarm(ownerOpenId: string, input: Omit<InsertFarm, "ownerOpenId">) {
  const db = await getDb();
  if (!db) return { ...demoFarm, ownerOpenId, ...input };
  const existing = await db.select().from(farms).where(eq(farms.ownerOpenId, ownerOpenId)).limit(1);
  if (existing[0]) await db.update(farms).set({ ...input, updatedAt: new Date() }).where(eq(farms.id, existing[0].id));
  else await db.insert(farms).values({ ownerOpenId, ...input });
  return getFarmByOwner(ownerOpenId);
}

export async function updateFarmById(ownerOpenId: string, farmId: number, input: Omit<InsertFarm, "ownerOpenId">) {
  const db = await getDb();
  if (!db) return { ...demoFarm, ownerOpenId, id: farmId, ...input };
  await db.update(farms).set({ ...input, updatedAt: new Date() }).where(and(eq(farms.id, farmId), eq(farms.ownerOpenId, ownerOpenId)));
  return getFarmById(ownerOpenId, farmId);
}

export async function createFarm(ownerOpenId: string, input: Omit<InsertFarm, "ownerOpenId">) {
  const db = await getDb();
  if (!db) return { ...demoFarm, ...input, ownerOpenId, id: Date.now() };
  const result = await db.insert(farms).values({ ownerOpenId, ...input });
  return getFarmById(ownerOpenId, Number(result[0].insertId));
}

export async function getPrimaryCrop(farmId: number) {
  const db = await getDb();
  if (!db || !farmId) return { id: 0, farmId, name: "Wheat", variety: "HD 2967", stage: "Vegetative", sowingDate: "2026-11-12", isPrimary: 1 };
  const result = await db.select().from(crops).where(and(eq(crops.farmId, farmId), eq(crops.isPrimary, 1))).limit(1);
  if (result[0]) return result[0];
  const firstCrop = await db.select().from(crops).where(eq(crops.farmId, farmId)).orderBy(asc(crops.createdAt)).limit(1);
  return firstCrop[0] ?? { id: 0, farmId, name: "Wheat", variety: "HD 2967", stage: "Vegetative", sowingDate: "2026-11-12", isPrimary: 1 };
}

export async function getCrops(farmId: number) {
  const db = await getDb();
  if (!db || !farmId) return [];
  return db.select().from(crops).where(eq(crops.farmId, farmId)).orderBy(desc(crops.isPrimary), asc(crops.createdAt));
}

export async function createCrop(farmId: number, values: { name: string; variety?: string | null; stage?: string; sowingDate?: string | null; harvestDate?: string | null; chemicalName?: string | null }) {
  const db = await getDb();
  if (!db || !farmId) return { id: 0, farmId, isPrimary: 0, ...values };
  const existing = await db.select({ id: crops.id }).from(crops).where(eq(crops.farmId, farmId)).limit(1);
  const result = await db.insert(crops).values({ farmId, isPrimary: existing.length ? 0 : 1, stage: values.stage ?? "Planning", ...values });
  return (await db.select().from(crops).where(eq(crops.id, Number(result[0].insertId))).limit(1))[0];
}

export async function upsertPrimaryCrop(farmId: number, values: { name: string; variety?: string | null; stage?: string; sowingDate?: string | null; harvestDate?: string | null; treatmentDate?: string | null; treatmentQuantity?: string | null; chemicalName?: string | null }) {
  const db = await getDb();
  if (!db || !farmId) return { id: 0, farmId, isPrimary: 1, ...values };
  const existing = await db.select().from(crops).where(and(eq(crops.farmId, farmId), eq(crops.isPrimary, 1))).limit(1);
  if (existing[0]) {
    await db.update(crops).set({ ...values, updatedAt: new Date() }).where(eq(crops.id, existing[0].id));
  } else {
    await db.insert(crops).values({ farmId, isPrimary: 1, stage: values.stage ?? "Planning", ...values });
  }
  return getPrimaryCrop(farmId);
}

export async function getTreatmentHistory(farmId: number) {
  const db = await getDb();
  if (!db || !farmId) return [];
  return db.select().from(treatmentHistory).where(eq(treatmentHistory.farmId, farmId)).orderBy(desc(treatmentHistory.treatmentDate), desc(treatmentHistory.id)).limit(30);
}

export async function addTreatmentHistory(values: typeof treatmentHistory.$inferInsert) {
  const db = await getDb();
  if (!db) return { ...values, id: 0 };
  await db.insert(treatmentHistory).values(values);
  return values;
}

export async function getIrrigationHistory(farmId: number) {
  const db = await getDb();
  if (!db || !farmId) return [];
  return db.select().from(irrigationHistory).where(eq(irrigationHistory.farmId, farmId)).orderBy(desc(irrigationHistory.irrigationDate), desc(irrigationHistory.id)).limit(30);
}

export async function addIrrigationHistory(values: typeof irrigationHistory.$inferInsert) {
  const db = await getDb();
  if (!db) return { ...values, id: 0 };
  await db.insert(irrigationHistory).values(values);
  return values;
}

export async function getLatestSoilTest(farmId: number) {
  const db = await getDb();
  if (!db || !farmId) return null;
  const result = await db.select().from(soilTests).where(eq(soilTests.farmId, farmId)).orderBy(desc(soilTests.testedAt)).limit(1);
  return result[0] ?? null;
}

export async function getRecommendation(ownerOpenId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(recommendations).where(and(eq(recommendations.ownerOpenId, ownerOpenId), eq(recommendations.status, "active"))).orderBy(desc(recommendations.updatedAt)).limit(1);
  return result[0] ?? null;
}

export async function saveChat(ownerOpenId: string, role: "user" | "assistant", content: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(chatMessages).values({ ownerOpenId, role, content });
}

export async function getRecentChat(ownerOpenId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(eq(chatMessages.ownerOpenId, ownerOpenId)).orderBy(asc(chatMessages.createdAt), asc(chatMessages.id)).limit(20);
}

export async function getAlertsForOwner(ownerOpenId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alerts).where(eq(alerts.ownerOpenId, ownerOpenId)).orderBy(desc(alerts.createdAt)).limit(30);
}

export async function markAlertRead(ownerOpenId: string, alertId: number) {
  const db = await getDb();
  if (!db) return { success: true };
  await db.update(alerts).set({ readAt: new Date() }).where(and(eq(alerts.ownerOpenId, ownerOpenId), eq(alerts.id, alertId)));
  return { success: true };
}

export async function getMarketPrices(district: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketPrices).where(eq(marketPrices.district, district)).orderBy(desc(marketPrices.createdAt)).limit(50);
}

export async function upsertMarketPrice(input: typeof marketPrices.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(marketPrices).where(and(eq(marketPrices.district, input.district), eq(marketPrices.commodity, input.commodity), eq(marketPrices.market, input.market))).limit(1);
  if (existing[0]) {
    await db.update(marketPrices).set({ ...input, createdAt: new Date() }).where(eq(marketPrices.id, existing[0].id));
  } else {
    await db.insert(marketPrices).values(input);
  }
}

export async function saveSoilTest(farmId: number, values: typeof soilTests.$inferInsert) {
  const db = await getDb();
  if (!db) return { ...values, id: 0 };
  return db.insert(soilTests).values({ ...values, farmId });
}

export async function saveWeatherSnapshot(input: {
  ownerOpenId: string; latitude: number; longitude: number; timezone?: string; payload: unknown; source: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(weatherSnapshots).values({
    ownerOpenId: input.ownerOpenId,
    latitude: String(input.latitude), longitude: String(input.longitude), timezone: input.timezone,
    payload: JSON.stringify(input.payload), source: input.source,
  });
}

export async function getLatestWeatherSnapshot(ownerOpenId: string, latitude: number, longitude: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(weatherSnapshots)
    .where(and(eq(weatherSnapshots.ownerOpenId, ownerOpenId), eq(weatherSnapshots.latitude, String(latitude)), eq(weatherSnapshots.longitude, String(longitude))))
    .orderBy(desc(weatherSnapshots.capturedAt)).limit(1);
  const row = result[0];
  if (!row) return null;
  try { return { ...JSON.parse(row.payload), storedAt: row.capturedAt, source: `${row.source} · database snapshot` }; }
  catch { return null; }
}

export async function saveDiseaseScan(input: { ownerOpenId: string; imageUrl: string; diagnosis: string; source: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(diseaseScans).values(input);
}

export async function getRecentDiseaseScans(ownerOpenId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(diseaseScans).where(eq(diseaseScans.ownerOpenId, ownerOpenId)).orderBy(desc(diseaseScans.createdAt)).limit(20);
}

export async function seedDemoData() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");
  const ownerOpenId = "demo-sneha";
  await db.insert(users).values({ openId: ownerOpenId, name: "Sneha Sharma", email: "sneha@kisaan-kareer.demo", loginMethod: "demo" }).onDuplicateKeyUpdate({ set: { name: "Sneha Sharma" } });
  await upsertFarm(ownerOpenId, {
    farmerName: "Sneha Sharma", location: "Meerut, Uttar Pradesh", district: "Meerut", state: "Uttar Pradesh",
    latitude: "28.9845", longitude: "77.7064", farmSizeAcres: "4.5", language: "English · Hindi",
    irrigationMethod: "Tube well", farmingPreference: "Conventional",
  });
  const farm = await getFarmByOwner(ownerOpenId);
  if (farm.id) {
    const crop = await db.select().from(crops).where(and(eq(crops.farmId, farm.id), eq(crops.isPrimary, 1))).limit(1);
    if (!crop[0]) await db.insert(crops).values({ farmId: farm.id, name: "Wheat", variety: "HD 2967", stage: "Vegetative", sowingDate: "2026-11-12", isPrimary: 1 });
    const soil = await db.select().from(soilTests).where(eq(soilTests.farmId, farm.id)).limit(1);
    if (!soil[0]) await db.insert(soilTests).values({ farmId: farm.id, ph: "7.4", nitrogen: "Medium", phosphorus: "High", potassium: "Medium", organicCarbon: "0.62", ec: "0.38", testedAt: new Date("2026-09-07T00:00:00Z") });
  }
  const markets = [
    ["Wheat", "2350", "2260", "2420", "2"], ["Rice", "3120", "2980", "3260", "1"], ["Mustard", "5460", "5300", "5600", "3"], ["Sugarcane", "340", "330", "350", "0"], ["Potato", "1180", "1080", "1260", "2.6"],
  ] as const;
  for (const [commodity, modalPrice, minPrice, maxPrice, changePercent] of markets) {
    await upsertMarketPrice({ district: "Meerut", market: "Meerut Mandi", commodity, modalPrice, minPrice, maxPrice, changePercent, priceDate: "2026-09-12", source: "Agmarknet demo snapshot" });
  }
  const existingAlerts = await getAlertsForOwner(ownerOpenId);
  if (!existingAlerts.length) {
    await db.insert(alerts).values([
      { ownerOpenId, kind: "weather", severity: "high", title: "High chance of rain in next 2 days", message: "Plan harvesting accordingly.", createdAt: new Date(Date.now() - 2 * 3600_000) },
      { ownerOpenId, kind: "market", severity: "medium", title: "Price of mustard increased by 3%", message: "Good time to sell in Meerut mandi.", createdAt: new Date(Date.now() - 4 * 3600_000) },
      { ownerOpenId, kind: "crop", severity: "high", title: "Possible fungal infection in wheat", message: "Check for yellowing leaves.", createdAt: new Date(Date.now() - 6 * 3600_000) },
    ]);
  }
  const existingRecommendation = await getRecommendation(ownerOpenId);
  if (!existingRecommendation) {
    await db.insert(recommendations).values({ ownerOpenId, title: "Delay irrigation until tomorrow morning", body: "Rain is expected in the next 24 hours and your wheat is in the vegetative stage. Waiting will save water and reduce the risk of waterlogging.", confidence: "HIGH CONFIDENCE", factors: JSON.stringify(["Rain likely", "Wheat · vegetative", "Soil moisture · medium"]), status: "active" });
  }
  const existingChat = await getRecentChat(ownerOpenId);
  if (!existingChat.length) {
    await db.insert(chatMessages).values([
      { ownerOpenId, role: "user", content: "What's the best time to water wheat in this weather?" },
      { ownerOpenId, role: "assistant", content: "In the current weather conditions, it is best to water wheat in the early morning or late evening to reduce evaporation and support better absorption." },
      { ownerOpenId, role: "user", content: "How much is the current price of mustard in Meerut mandi?" },
      { ownerOpenId, role: "assistant", content: "The current demo snapshot price of mustard in Meerut Mandi is ₹5,460 per quintal." },
    ]);
  }
  return { ownerOpenId, farmId: farm.id, seeded: true };
}
