import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const farms = mysqlTable("farms", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  farmerName: varchar("farmerName", { length: 120 }).notNull(),
  location: varchar("location", { length: 160 }).notNull(),
  district: varchar("district", { length: 80 }).notNull(),
  state: varchar("state", { length: 80 }).notNull(),
  latitude: varchar("latitude", { length: 24 }).notNull(),
  longitude: varchar("longitude", { length: 24 }).notNull(),
  farmSizeAcres: varchar("farmSizeAcres", { length: 16 }).notNull(),
  language: varchar("language", { length: 32 }).notNull().default("English"),
  irrigationMethod: varchar("irrigationMethod", { length: 64 }).notNull().default("Tube well"),
  farmingPreference: varchar("farmingPreference", { length: 32 }).notNull().default("Conventional"),
  soilType: varchar("soilType", { length: 80 }).notNull().default("Not tested"),
  soilReportAvailable: int("soilReportAvailable").notNull().default(0),
  irrigationFrequency: varchar("irrigationFrequency", { length: 64 }).notNull().default("As needed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const crops = mysqlTable("crops", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  variety: varchar("variety", { length: 100 }),
  stage: varchar("stage", { length: 64 }).notNull(),
  sowingDate: varchar("sowingDate", { length: 24 }),
  harvestDate: varchar("harvestDate", { length: 24 }),
  treatmentDate: varchar("treatmentDate", { length: 24 }),
  treatmentQuantity: varchar("treatmentQuantity", { length: 64 }),
  chemicalName: varchar("chemicalName", { length: 120 }),
  isPrimary: int("isPrimary").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});


export const treatmentHistory = mysqlTable("treatmentHistory", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  cropId: int("cropId"),
  treatmentDate: varchar("treatmentDate", { length: 24 }).notNull(),
  chemicalName: varchar("chemicalName", { length: 120 }).notNull(),
  quantity: varchar("quantity", { length: 64 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const irrigationHistory = mysqlTable("irrigationHistory", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  cropId: int("cropId"),
  irrigationDate: varchar("irrigationDate", { length: 24 }).notNull(),
  method: varchar("method", { length: 64 }),
  duration: varchar("duration", { length: 64 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const soilTests = mysqlTable("soilTests", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  ph: varchar("ph", { length: 16 }),
  nitrogen: varchar("nitrogen", { length: 16 }),
  phosphorus: varchar("phosphorus", { length: 16 }),
  potassium: varchar("potassium", { length: 16 }),
  organicCarbon: varchar("organicCarbon", { length: 16 }),
  ec: varchar("ec", { length: 16 }),
  reportUrl: text("reportUrl"),
  testedAt: timestamp("testedAt").defaultNow().notNull(),
});

export const marketPrices = mysqlTable("marketPrices", {
  id: int("id").autoincrement().primaryKey(),
  district: varchar("district", { length: 80 }).notNull(),
  market: varchar("market", { length: 120 }).notNull(),
  commodity: varchar("commodity", { length: 80 }).notNull(),
  minPrice: varchar("minPrice", { length: 24 }),
  maxPrice: varchar("maxPrice", { length: 24 }),
  modalPrice: varchar("modalPrice", { length: 24 }).notNull(),
  changePercent: varchar("changePercent", { length: 16 }).notNull().default("0"),
  priceDate: varchar("priceDate", { length: 24 }).notNull(),
  source: varchar("source", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  kind: varchar("kind", { length: 40 }).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high"]).notNull().default("medium"),
  title: varchar("title", { length: 180 }).notNull(),
  message: text("message").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const recommendations = mysqlTable("recommendations", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  confidence: varchar("confidence", { length: 32 }).notNull().default("High confidence"),
  factors: text("factors").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const weatherSnapshots = mysqlTable("weatherSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  latitude: varchar("latitude", { length: 24 }).notNull(),
  longitude: varchar("longitude", { length: 24 }).notNull(),
  timezone: varchar("timezone", { length: 80 }),
  payload: text("payload").notNull(),
  source: varchar("source", { length: 120 }).notNull(),
  capturedAt: timestamp("capturedAt").defaultNow().notNull(),
});

export const diseaseScans = mysqlTable("diseaseScans", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  diagnosis: text("diagnosis").notNull(),
  source: varchar("source", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Farm = typeof farms.$inferSelect;
export type InsertFarm = typeof farms.$inferInsert;
export type Crop = typeof crops.$inferSelect;
export type SoilTest = typeof soilTests.$inferSelect;
export type MarketPrice = typeof marketPrices.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type Recommendation = typeof recommendations.$inferSelect;
export type WeatherSnapshot = typeof weatherSnapshots.$inferSelect;
export type DiseaseScan = typeof diseaseScans.$inferSelect;
export type TreatmentHistory = typeof treatmentHistory.$inferSelect;
export type IrrigationHistory = typeof irrigationHistory.$inferSelect;
