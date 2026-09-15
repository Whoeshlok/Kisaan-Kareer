// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/_core/oauth.ts
import { parse as parseCookieHeader2 } from "cookie";

// server/db.ts
import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var farms = mysqlTable("farms", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var crops = mysqlTable("crops", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var treatmentHistory = mysqlTable("treatmentHistory", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  cropId: int("cropId"),
  treatmentDate: varchar("treatmentDate", { length: 24 }).notNull(),
  chemicalName: varchar("chemicalName", { length: 120 }).notNull(),
  quantity: varchar("quantity", { length: 64 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var irrigationHistory = mysqlTable("irrigationHistory", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  cropId: int("cropId"),
  irrigationDate: varchar("irrigationDate", { length: 24 }).notNull(),
  method: varchar("method", { length: 64 }),
  duration: varchar("duration", { length: 64 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var soilTests = mysqlTable("soilTests", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  ph: varchar("ph", { length: 16 }),
  nitrogen: varchar("nitrogen", { length: 16 }),
  phosphorus: varchar("phosphorus", { length: 16 }),
  potassium: varchar("potassium", { length: 16 }),
  organicCarbon: varchar("organicCarbon", { length: 16 }),
  ec: varchar("ec", { length: 16 }),
  reportUrl: text("reportUrl"),
  testedAt: timestamp("testedAt").defaultNow().notNull()
});
var marketPrices = mysqlTable("marketPrices", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  kind: varchar("kind", { length: 40 }).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high"]).notNull().default("medium"),
  title: varchar("title", { length: 180 }).notNull(),
  message: text("message").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var recommendations = mysqlTable("recommendations", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  confidence: varchar("confidence", { length: 32 }).notNull().default("High confidence"),
  factors: text("factors").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var weatherSnapshots = mysqlTable("weatherSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  latitude: varchar("latitude", { length: 24 }).notNull(),
  longitude: varchar("longitude", { length: 24 }).notNull(),
  timezone: varchar("timezone", { length: 80 }),
  payload: text("payload").notNull(),
  source: varchar("source", { length: 120 }).notNull(),
  capturedAt: timestamp("capturedAt").defaultNow().notNull()
});
var diseaseScans = mysqlTable("diseaseScans", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  diagnosis: text("diagnosis").notNull(),
  source: varchar("source", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  await db.insert(users).values(user).onDuplicateKeyUpdate({
    set: { name: user.name, email: user.email, loginMethod: user.loginMethod, lastSignedIn: /* @__PURE__ */ new Date() }
  });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
async function getUserByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}
async function createLocalUser(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(users).values({ ...input, loginMethod: "email" });
  return getUserByOpenId(input.openId);
}
var demoFarm = {
  id: 0,
  ownerOpenId: "demo-sneha",
  farmerName: "Sneha Sharma",
  location: "Meerut, Uttar Pradesh",
  district: "Meerut",
  state: "Uttar Pradesh",
  latitude: "28.9845",
  longitude: "77.7064",
  farmSizeAcres: "4.5",
  language: "English \xB7 Hindi",
  irrigationMethod: "Tube well",
  farmingPreference: "Conventional"
};
async function getFarmsByOwner(ownerOpenId) {
  const db = await getDb();
  if (!db) return [{ ...demoFarm, ownerOpenId }];
  return db.select().from(farms).where(eq(farms.ownerOpenId, ownerOpenId)).orderBy(asc(farms.createdAt));
}
async function getFarmByOwner(ownerOpenId) {
  const farmsForOwner = await getFarmsByOwner(ownerOpenId);
  return farmsForOwner[0] ?? { ...demoFarm, ownerOpenId };
}
async function getFarmById(ownerOpenId, farmId) {
  const db = await getDb();
  if (!db || !farmId) return getFarmByOwner(ownerOpenId);
  const result = await db.select().from(farms).where(and(eq(farms.id, farmId), eq(farms.ownerOpenId, ownerOpenId))).limit(1);
  return result[0] ?? getFarmByOwner(ownerOpenId);
}
async function upsertFarm(ownerOpenId, input) {
  const db = await getDb();
  if (!db) return { ...demoFarm, ownerOpenId, ...input };
  const existing = await db.select().from(farms).where(eq(farms.ownerOpenId, ownerOpenId)).limit(1);
  if (existing[0]) await db.update(farms).set({ ...input, updatedAt: /* @__PURE__ */ new Date() }).where(eq(farms.id, existing[0].id));
  else await db.insert(farms).values({ ownerOpenId, ...input });
  return getFarmByOwner(ownerOpenId);
}
async function updateFarmById(ownerOpenId, farmId, input) {
  const db = await getDb();
  if (!db) return { ...demoFarm, ownerOpenId, id: farmId, ...input };
  await db.update(farms).set({ ...input, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(farms.id, farmId), eq(farms.ownerOpenId, ownerOpenId)));
  return getFarmById(ownerOpenId, farmId);
}
async function createFarm(ownerOpenId, input) {
  const db = await getDb();
  if (!db) return { ...demoFarm, ...input, ownerOpenId, id: Date.now() };
  const result = await db.insert(farms).values({ ownerOpenId, ...input });
  return getFarmById(ownerOpenId, Number(result[0].insertId));
}
async function getPrimaryCrop(farmId) {
  const db = await getDb();
  if (!db || !farmId) return { id: 0, farmId, name: "Wheat", variety: "HD 2967", stage: "Vegetative", sowingDate: "2026-11-12", isPrimary: 1 };
  const result = await db.select().from(crops).where(and(eq(crops.farmId, farmId), eq(crops.isPrimary, 1))).limit(1);
  if (result[0]) return result[0];
  const firstCrop = await db.select().from(crops).where(eq(crops.farmId, farmId)).orderBy(asc(crops.createdAt)).limit(1);
  return firstCrop[0] ?? { id: 0, farmId, name: "Wheat", variety: "HD 2967", stage: "Vegetative", sowingDate: "2026-11-12", isPrimary: 1 };
}
async function getCrops(farmId) {
  const db = await getDb();
  if (!db || !farmId) return [];
  return db.select().from(crops).where(eq(crops.farmId, farmId)).orderBy(desc(crops.isPrimary), asc(crops.createdAt));
}
async function createCrop(farmId, values) {
  const db = await getDb();
  if (!db || !farmId) return { id: 0, farmId, isPrimary: 0, ...values };
  const existing = await db.select({ id: crops.id }).from(crops).where(eq(crops.farmId, farmId)).limit(1);
  const result = await db.insert(crops).values({ farmId, isPrimary: existing.length ? 0 : 1, stage: values.stage ?? "Planning", ...values });
  return (await db.select().from(crops).where(eq(crops.id, Number(result[0].insertId))).limit(1))[0];
}
async function upsertPrimaryCrop(farmId, values) {
  const db = await getDb();
  if (!db || !farmId) return { id: 0, farmId, isPrimary: 1, ...values };
  const existing = await db.select().from(crops).where(and(eq(crops.farmId, farmId), eq(crops.isPrimary, 1))).limit(1);
  if (existing[0]) {
    await db.update(crops).set({ ...values, updatedAt: /* @__PURE__ */ new Date() }).where(eq(crops.id, existing[0].id));
  } else {
    await db.insert(crops).values({ farmId, isPrimary: 1, stage: values.stage ?? "Planning", ...values });
  }
  return getPrimaryCrop(farmId);
}
async function getTreatmentHistory(farmId) {
  const db = await getDb();
  if (!db || !farmId) return [];
  return db.select().from(treatmentHistory).where(eq(treatmentHistory.farmId, farmId)).orderBy(desc(treatmentHistory.treatmentDate), desc(treatmentHistory.id)).limit(30);
}
async function addTreatmentHistory(values) {
  const db = await getDb();
  if (!db) return { ...values, id: 0 };
  await db.insert(treatmentHistory).values(values);
  return values;
}
async function getIrrigationHistory(farmId) {
  const db = await getDb();
  if (!db || !farmId) return [];
  return db.select().from(irrigationHistory).where(eq(irrigationHistory.farmId, farmId)).orderBy(desc(irrigationHistory.irrigationDate), desc(irrigationHistory.id)).limit(30);
}
async function addIrrigationHistory(values) {
  const db = await getDb();
  if (!db) return { ...values, id: 0 };
  await db.insert(irrigationHistory).values(values);
  return values;
}
async function getLatestSoilTest(farmId) {
  const db = await getDb();
  if (!db || !farmId) return null;
  const result = await db.select().from(soilTests).where(eq(soilTests.farmId, farmId)).orderBy(desc(soilTests.testedAt)).limit(1);
  return result[0] ?? null;
}
async function getRecommendation(ownerOpenId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(recommendations).where(and(eq(recommendations.ownerOpenId, ownerOpenId), eq(recommendations.status, "active"))).orderBy(desc(recommendations.updatedAt)).limit(1);
  return result[0] ?? null;
}
async function saveChat(ownerOpenId, role, content) {
  const db = await getDb();
  if (!db) return;
  await db.insert(chatMessages).values({ ownerOpenId, role, content });
}
async function getRecentChat(ownerOpenId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(eq(chatMessages.ownerOpenId, ownerOpenId)).orderBy(asc(chatMessages.createdAt), asc(chatMessages.id)).limit(20);
}
async function getAlertsForOwner(ownerOpenId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alerts).where(eq(alerts.ownerOpenId, ownerOpenId)).orderBy(desc(alerts.createdAt)).limit(30);
}
async function markAlertRead(ownerOpenId, alertId) {
  const db = await getDb();
  if (!db) return { success: true };
  await db.update(alerts).set({ readAt: /* @__PURE__ */ new Date() }).where(and(eq(alerts.ownerOpenId, ownerOpenId), eq(alerts.id, alertId)));
  return { success: true };
}
async function getMarketPrices(district) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketPrices).where(eq(marketPrices.district, district)).orderBy(desc(marketPrices.createdAt)).limit(50);
}
async function upsertMarketPrice(input) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(marketPrices).where(and(eq(marketPrices.district, input.district), eq(marketPrices.commodity, input.commodity), eq(marketPrices.market, input.market))).limit(1);
  if (existing[0]) {
    await db.update(marketPrices).set({ ...input, createdAt: /* @__PURE__ */ new Date() }).where(eq(marketPrices.id, existing[0].id));
  } else {
    await db.insert(marketPrices).values(input);
  }
}
async function saveWeatherSnapshot(input) {
  const db = await getDb();
  if (!db) return;
  await db.insert(weatherSnapshots).values({
    ownerOpenId: input.ownerOpenId,
    latitude: String(input.latitude),
    longitude: String(input.longitude),
    timezone: input.timezone,
    payload: JSON.stringify(input.payload),
    source: input.source
  });
}
async function getLatestWeatherSnapshot(ownerOpenId, latitude, longitude) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(weatherSnapshots).where(and(eq(weatherSnapshots.ownerOpenId, ownerOpenId), eq(weatherSnapshots.latitude, String(latitude)), eq(weatherSnapshots.longitude, String(longitude)))).orderBy(desc(weatherSnapshots.capturedAt)).limit(1);
  const row = result[0];
  if (!row) return null;
  try {
    return { ...JSON.parse(row.payload), storedAt: row.capturedAt, source: `${row.source} \xB7 database snapshot` };
  } catch {
    return null;
  }
}
async function saveDiseaseScan(input) {
  const db = await getDb();
  if (!db) return;
  await db.insert(diseaseScans).values(input);
}
async function getRecentDiseaseScans(ownerOpenId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(diseaseScans).where(eq(diseaseScans.ownerOpenId, ownerOpenId)).orderBy(desc(diseaseScans.createdAt)).limit(20);
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/sdk.ts
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader2(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/routers.ts
import { z as z2 } from "zod";
import { randomUUID } from "node:crypto";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
var RETRY_MAX_RETRIES = 4;
var RETRY_BASE_DELAY_MS = 500;
var RETRY_MAX_DELAY_MS = 3e4;
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var parseRetryAfter = (value) => {
  if (!value) return void 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1e3);
  const at = Date.parse(value);
  return Number.isNaN(at) ? void 0 : Math.max(0, at - Date.now());
};
var computeBackoffDelay = (attempt, retryAfterMs) => {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jittered = cap / 2 + Math.random() * (cap / 2);
  return Math.min(Math.max(jittered, retryAfterMs ?? 0), RETRY_MAX_DELAY_MS);
};
var fetchWithBackoff = async (url, init) => {
  let lastError;
  for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || attempt === RETRY_MAX_RETRIES) {
        return response;
      }
      const retryAfterMs = parseRetryAfter(
        response.headers.get("retry-after")
      );
      try {
        await response.body?.cancel();
      } catch {
      }
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after status ${response.status}`
      );
      await sleep(computeBackoffDelay(attempt, retryAfterMs));
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_MAX_RETRIES) throw error;
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after network error`
      );
      await sleep(computeBackoffDelay(attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("LLM request failed after exhausting retries");
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    model,
    thinking,
    reasoning,
    maxTokens,
    max_tokens
  } = params;
  const payload = {
    messages: messages.map(normalizeMessage)
  };
  if (model) {
    payload.model = model;
  }
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  const resolvedMaxTokens = max_tokens ?? maxTokens;
  if (typeof resolvedMaxTokens === "number") {
    payload.max_tokens = resolvedMaxTokens;
  }
  if (thinking) {
    payload.thinking = thinking;
  }
  if (reasoning) {
    payload.reasoning = reasoning;
  }
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetchWithBackoff(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/storage.ts
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}
async function storageGetSignedUrl(relKey) {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = normalizeKey(relKey);
  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);
  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }
  const { url } = await resp.json();
  return url;
}

// server/password.ts
import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
var scrypt = promisify(nodeScrypt);
var KEY_LENGTH = 64;
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}
async function verifyPassword(password, encoded) {
  const [algorithm, salt, storedHex] = encoded.split(":");
  if (algorithm !== "scrypt" || !salt || !storedHex) return false;
  const stored = Buffer.from(storedHex, "hex");
  const derivedKey = await scrypt(password, salt, stored.length);
  return stored.length === derivedKey.length && timingSafeEqual(stored, derivedKey);
}

// server/_core/voiceTranscription.ts
async function transcribeAudio(options) {
  try {
    if (!ENV.forgeApiUrl) {
      return {
        error: "Voice transcription service is not configured",
        code: "SERVICE_ERROR",
        details: "BUILT_IN_FORGE_API_URL is not set"
      };
    }
    if (!ENV.forgeApiKey) {
      return {
        error: "Voice transcription service authentication is missing",
        code: "SERVICE_ERROR",
        details: "BUILT_IN_FORGE_API_KEY is not set"
      };
    }
    let audioBuffer;
    let mimeType = normalizeMimeType(options.mimeType || "audio/mpeg");
    try {
      if (options.audioBuffer) {
        audioBuffer = Buffer.from(options.audioBuffer);
      } else if (options.audioUrl) {
        const response2 = await fetch(options.audioUrl);
        if (!response2.ok) {
          return {
            error: "Failed to download audio file",
            code: "INVALID_FORMAT",
            details: `HTTP ${response2.status}: ${response2.statusText}`
          };
        }
        audioBuffer = Buffer.from(await response2.arrayBuffer());
        mimeType = normalizeMimeType(options.mimeType || response2.headers.get("content-type") || "audio/mpeg");
      } else {
        return { error: "No audio recording was provided", code: "INVALID_FORMAT" };
      }
      const sizeMB = audioBuffer.length / (1024 * 1024);
      if (sizeMB > 16) {
        return {
          error: "Audio file exceeds maximum size limit",
          code: "FILE_TOO_LARGE",
          details: `File size is ${sizeMB.toFixed(2)}MB, maximum allowed is 16MB`
        };
      }
    } catch (error) {
      return {
        error: "Failed to read audio file",
        code: "SERVICE_ERROR",
        details: error instanceof Error ? error.message : "Unknown error"
      };
    }
    const formData = new FormData();
    const filename = `audio.${getFileExtension(mimeType)}`;
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
    formData.append("file", audioBlob, filename);
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");
    const requestedLanguage = normalizeLanguageCode(options.language);
    if (requestedLanguage) formData.append("language", requestedLanguage);
    const prompt = options.prompt || (options.language ? `The speaker is speaking ${getLanguageName(options.language)}. Use only that language; do not identify it as Urdu or another language. Transcribe every word accurately. ${options.language === "hinglish" ? "Keep Hindi words in the same Roman-script Hindi and English mix spoken by the farmer." : "Preserve the script and words of the selected language."}` : "Transcribe the user's voice to text");
    formData.append("prompt", prompt);
    const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
    const fullUrl = new URL(
      "v1/audio/transcriptions",
      baseUrl
    ).toString();
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "Accept-Encoding": "identity"
      },
      body: formData
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        error: "Transcription service request failed",
        code: "TRANSCRIPTION_FAILED",
        details: `${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`
      };
    }
    const whisperResponse = await response.json();
    if (!whisperResponse.text || typeof whisperResponse.text !== "string") {
      return {
        error: "Invalid transcription response",
        code: "SERVICE_ERROR",
        details: "Transcription service returned an invalid response format"
      };
    }
    return { ...whisperResponse, language: requestedLanguage || whisperResponse.language };
  } catch (error) {
    return {
      error: "Voice transcription failed",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}
function getFileExtension(mimeType) {
  mimeType = normalizeMimeType(mimeType);
  const mimeToExt = {
    "audio/webm": "webm",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/ogg": "ogg",
    "audio/m4a": "m4a",
    "audio/mp4": "m4a"
  };
  return mimeToExt[mimeType] || "audio";
}
function normalizeMimeType(mimeType) {
  return mimeType.split(";", 1)[0].trim().toLowerCase();
}
function normalizeLanguageCode(language) {
  if (!language || language === "hinglish") return language === "hinglish" ? "hi" : void 0;
  const supported = /* @__PURE__ */ new Set(["hi", "ta", "te", "mr", "bn", "gu", "kn", "ml", "pa", "ur", "en"]);
  return supported.has(language) ? language : void 0;
}
function getLanguageName(langCode) {
  const langMap = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ru": "Russian",
    "ja": "Japanese",
    "ko": "Korean",
    "zh": "Chinese",
    "ar": "Arabic",
    "hi": "Hindi",
    "nl": "Dutch",
    "pl": "Polish",
    "tr": "Turkish",
    "sv": "Swedish",
    "da": "Danish",
    "no": "Norwegian",
    "fi": "Finnish"
  };
  return langMap[langCode] || langCode;
}

// server/routers.ts
var demoMarkets = (district) => [
  { commodity: "Wheat", market: `${district} Mandi`, modalPrice: "2350", minPrice: "2260", maxPrice: "2420", change: 2, priceDate: "2026-09-12", source: "Agmarknet demo snapshot" },
  { commodity: "Rice", market: `${district} Mandi`, modalPrice: "3120", minPrice: "2980", maxPrice: "3260", change: 1, priceDate: "2026-09-12", source: "Agmarknet demo snapshot" },
  { commodity: "Mustard", market: `${district} Mandi`, modalPrice: "5460", minPrice: "5300", maxPrice: "5600", change: 3, priceDate: "2026-09-12", source: "Agmarknet demo snapshot" },
  { commodity: "Sugarcane", market: `${district} Mandi`, modalPrice: "340", minPrice: "330", maxPrice: "350", change: 0, priceDate: "2026-09-12", source: "Agmarknet demo snapshot" },
  { commodity: "Potato", market: `${district} Mandi`, modalPrice: "1180", minPrice: "1080", maxPrice: "1260", change: 2.6, priceDate: "2026-09-12", source: "Agmarknet demo snapshot" }
];
var weatherLabel = (code) => {
  if (code === 0) return "Clear sky";
  if ([1, 2].includes(code)) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Light drizzle";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "Rain showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorms";
  return "Mixed conditions";
};
var ownerId = (ctx) => ctx.user?.openId ?? "demo-sneha";
async function fetchWeather(latitude, longitude, ownerOpenId) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max");
  url.searchParams.set("forecast_days", "5");
  url.searchParams.set("timezone", "auto");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather provider returned ${response.status}`);
  const data = await response.json();
  const currentCode = Number(data.current?.weather_code ?? 2);
  const result = {
    source: "Open-Meteo live forecast",
    timezone: data.timezone,
    current: {
      temperature: Number(data.current?.temperature_2m ?? 28),
      humidity: Number(data.current?.relative_humidity_2m ?? 72),
      rainfall: Number(data.current?.precipitation ?? 0),
      rainProbability: Number(data.daily?.precipitation_probability_max?.[0] ?? 20),
      windSpeed: Number(data.current?.wind_speed_10m ?? 12),
      code: currentCode,
      label: weatherLabel(currentCode)
    },
    daily: (data.daily?.time ?? []).map((date, index) => ({
      date,
      max: Number(data.daily.temperature_2m_max?.[index] ?? 28),
      min: Number(data.daily.temperature_2m_min?.[index] ?? 20),
      probability: Number(data.daily.precipitation_probability_max?.[index] ?? 20),
      code: Number(data.daily.weather_code?.[index] ?? 2),
      label: weatherLabel(Number(data.daily.weather_code?.[index] ?? 2)),
      wind: Number(data.daily.wind_speed_10m_max?.[index] ?? 12)
    }))
  };
  await saveWeatherSnapshot({ ownerOpenId, latitude, longitude, timezone: result.timezone, payload: result, source: "Open-Meteo live forecast" });
  return result;
}
async function fetchMarkets(district, state, ownerOpenId) {
  const apiKey = process.env.DATA_GOV_API_KEY;
  if (!apiKey) {
    const stored = await getMarketPrices(district);
    if (stored.length) return { source: "Project database \xB7 seeded market snapshot", live: false, items: stored.map((row) => ({ ...row, change: Number(row.changePercent) })) };
    return { source: `Demo snapshot for ${district} \xB7 add DATA_GOV_API_KEY for live Agmarknet data`, live: false, items: demoMarkets(district) };
  }
  const url = new URL("https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070");
  url.searchParams.set("api-key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "100");
  url.searchParams.set("filters[State]", state);
  url.searchParams.set("filters[District]", district);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Mandi provider returned ${response.status}`);
    const data = await response.json();
    const items = (data.records ?? []).slice(0, 20).map((record) => ({
      commodity: record.Commodity ?? record.commodity ?? "Unknown crop",
      market: record.Market ?? record.market ?? `${district} Mandi`,
      modalPrice: String(record.Modal_Price ?? record.modal_price ?? record.ModalPrice ?? "0"),
      minPrice: String(record.Min_Price ?? record.min_price ?? "0"),
      maxPrice: String(record.Max_Price ?? record.max_price ?? "0"),
      change: 0,
      priceDate: record.Arrival_Date ?? record.arrival_date ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      source: "data.gov.in \xB7 Agmarknet"
    }));
    for (const item of items) await upsertMarketPrice({ district, market: item.market, commodity: item.commodity, modalPrice: item.modalPrice, minPrice: item.minPrice, maxPrice: item.maxPrice, changePercent: String(item.change), priceDate: item.priceDate, source: item.source });
    return { source: "data.gov.in \xB7 Agmarknet live feed \xB7 cached in project database", live: true, items: items.length ? items : demoMarkets(district) };
  } catch (error) {
    console.error("[Market] provider failed", error);
    const stored = await getMarketPrices(district);
    return { source: `Project database \xB7 last available ${district} market snapshot`, live: false, items: stored.length ? stored.map((row) => ({ ...row, change: Number(row.changePercent) })) : demoMarkets(district) };
  }
}
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    signup: publicProcedure.input(z2.object({ name: z2.string().min(2).max(120), email: z2.string().email(), password: z2.string().min(8).max(120) })).mutation(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase();
      if (await getUserByEmail(email)) throw new TRPCError3({ code: "CONFLICT", message: "An account with this email already exists." });
      const openId = `local-${randomUUID()}`;
      const user = await createLocalUser({ openId, name: input.name.trim(), email, passwordHash: await hashPassword(input.password) });
      if (!user) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Could not create your account." });
      await upsertFarm(openId, { farmerName: input.name.trim(), language: "English", location: "India", district: "Not set", state: "Not set", latitude: "20.5937", longitude: "78.9629", farmSizeAcres: "1", irrigationMethod: "Not set", farmingPreference: "Conventional" });
      const token = await sdk.signSession({ openId, appId: process.env.VITE_APP_ID ?? "", name: input.name.trim() });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return { user };
    }),
    signin: publicProcedure.input(z2.object({ email: z2.string().email(), password: z2.string().min(1) })).mutation(async ({ ctx, input }) => {
      const user = await getUserByEmail(input.email.trim().toLowerCase());
      if (!user?.passwordHash || !await verifyPassword(input.password, user.passwordHash)) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Email or password is incorrect." });
      const token = await sdk.signSession({ openId: user.openId, appId: process.env.VITE_APP_ID ?? "", name: user.name ?? "Farmer" });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return { user };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  farm: router({
    list: publicProcedure.query(({ ctx }) => getFarmsByOwner(ownerId(ctx))),
    profile: publicProcedure.input(z2.object({ farmId: z2.number().optional() }).optional()).query(({ ctx, input }) => input?.farmId ? getFarmById(ownerId(ctx), input.farmId) : getFarmByOwner(ownerId(ctx))),
    crops: publicProcedure.input(z2.object({ farmId: z2.number().optional() }).optional()).query(async ({ ctx, input }) => {
      const farm = input?.farmId ? await getFarmById(ownerId(ctx), input.farmId) : await getFarmByOwner(ownerId(ctx));
      return getCrops(farm.id);
    }),
    primaryCrop: publicProcedure.input(z2.object({ farmId: z2.number().optional() }).optional()).query(async ({ ctx, input }) => {
      const farm = input?.farmId ? await getFarmById(ownerId(ctx), input.farmId) : await getFarmByOwner(ownerId(ctx));
      return getPrimaryCrop(farm.id);
    }),
    soil: publicProcedure.input(z2.object({ farmId: z2.number().optional() }).optional()).query(async ({ ctx, input }) => {
      const farm = input?.farmId ? await getFarmById(ownerId(ctx), input.farmId) : await getFarmByOwner(ownerId(ctx));
      return getLatestSoilTest(farm.id);
    }),
    create: publicProcedure.input(z2.object({ farmerName: z2.string().min(2), location: z2.string().min(2), district: z2.string().min(2), state: z2.string().min(2), latitude: z2.string(), longitude: z2.string(), farmSizeAcres: z2.string(), language: z2.string().default("English"), irrigationMethod: z2.string().default("Tube well"), farmingPreference: z2.string().default("Conventional"), soilType: z2.string().default("Not tested"), soilReportAvailable: z2.number().default(0), irrigationFrequency: z2.string().default("As needed") })).mutation(({ ctx, input }) => createFarm(ownerId(ctx), input)),
    addCrop: publicProcedure.input(z2.object({ farmId: z2.number(), name: z2.string().min(1), variety: z2.string().optional(), stage: z2.string().optional(), sowingDate: z2.string().optional(), harvestDate: z2.string().optional(), chemicalName: z2.string().optional() })).mutation(({ input }) => createCrop(input.farmId, input)),
    treatments: publicProcedure.input(z2.object({ farmId: z2.number().optional() }).optional()).query(async ({ ctx, input }) => {
      const farm = input?.farmId ? await getFarmById(ownerId(ctx), input.farmId) : await getFarmByOwner(ownerId(ctx));
      return getTreatmentHistory(farm.id);
    }),
    addTreatment: publicProcedure.input(z2.object({ farmId: z2.number(), cropId: z2.number().optional(), treatmentDate: z2.string(), chemicalName: z2.string().min(1), quantity: z2.string().optional(), notes: z2.string().optional() })).mutation(({ input }) => addTreatmentHistory(input)),
    irrigations: publicProcedure.input(z2.object({ farmId: z2.number().optional() }).optional()).query(async ({ ctx, input }) => {
      const farm = input?.farmId ? await getFarmById(ownerId(ctx), input.farmId) : await getFarmByOwner(ownerId(ctx));
      return getIrrigationHistory(farm.id);
    }),
    addIrrigation: publicProcedure.input(z2.object({ farmId: z2.number(), cropId: z2.number().optional(), irrigationDate: z2.string(), method: z2.string().optional(), duration: z2.string().optional(), notes: z2.string().optional() })).mutation(({ input }) => addIrrigationHistory(input)),
    update: publicProcedure.input(z2.object({
      farmId: z2.number().optional(),
      farmerName: z2.string().min(2).optional(),
      location: z2.string().min(2).optional(),
      district: z2.string().min(2).optional(),
      state: z2.string().min(2).optional(),
      latitude: z2.string().optional(),
      longitude: z2.string().optional(),
      farmSizeAcres: z2.string().optional(),
      language: z2.string().optional(),
      irrigationMethod: z2.string().optional(),
      farmingPreference: z2.string().optional(),
      soilType: z2.string().optional(),
      soilReportAvailable: z2.number().int().min(0).max(1).optional(),
      irrigationFrequency: z2.string().optional(),
      cropName: z2.string().optional(),
      cropVariety: z2.string().optional(),
      sowingDate: z2.string().optional(),
      harvestDate: z2.string().optional(),
      treatmentDate: z2.string().optional(),
      treatmentQuantity: z2.string().optional(),
      chemicalName: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const current = input.farmId ? await getFarmById(ownerId(ctx), input.farmId) : await getFarmByOwner(ownerId(ctx));
      const farmValues = {
        farmerName: input.farmerName ?? current.farmerName,
        location: input.location ?? current.location,
        district: input.district ?? current.district,
        state: input.state ?? current.state,
        latitude: input.latitude ?? current.latitude,
        longitude: input.longitude ?? current.longitude,
        farmSizeAcres: input.farmSizeAcres ?? current.farmSizeAcres,
        language: input.language ?? current.language,
        irrigationMethod: input.irrigationMethod ?? current.irrigationMethod,
        farmingPreference: input.farmingPreference ?? current.farmingPreference,
        soilType: input.soilType ?? current.soilType ?? "Not tested",
        soilReportAvailable: input.soilReportAvailable ?? current.soilReportAvailable ?? 0,
        irrigationFrequency: input.irrigationFrequency ?? current.irrigationFrequency ?? "As needed"
      };
      const updatedFarm = await (input.farmId ? updateFarmById(ownerId(ctx), input.farmId, farmValues) : upsertFarm(ownerId(ctx), farmValues));
      if (input.cropName || input.cropVariety || input.sowingDate || input.harvestDate || input.treatmentDate || input.treatmentQuantity || input.chemicalName) {
        const crop = await getPrimaryCrop(current.id);
        await upsertPrimaryCrop(current.id, { name: input.cropName ?? crop?.name ?? "Wheat", variety: input.cropVariety ?? crop?.variety ?? "", stage: crop?.stage ?? "Planning", sowingDate: input.sowingDate ?? crop?.sowingDate ?? "", harvestDate: input.harvestDate ?? crop?.harvestDate ?? "", treatmentDate: input.treatmentDate ?? crop?.treatmentDate ?? "", treatmentQuantity: input.treatmentQuantity ?? crop?.treatmentQuantity ?? "", chemicalName: input.chemicalName ?? crop?.chemicalName ?? "" });
      }
      return updatedFarm;
    })
  }),
  soil: router({
    suggest: publicProcedure.input(z2.object({ latitude: z2.number(), longitude: z2.number() })).query(async ({ input }) => {
      try {
        const url = new URL("https://rest.isric.org/soilgrids/v2.0/properties/query");
        url.searchParams.set("lon", String(input.longitude));
        url.searchParams.set("lat", String(input.latitude));
        ["clay", "sand", "silt"].forEach((property) => url.searchParams.append("property", property));
        url.searchParams.set("depth", "0-5cm");
        url.searchParams.set("value", "mean");
        const response = await fetch(url, { signal: AbortSignal.timeout(8e3) });
        if (!response.ok) throw new Error("SoilGrids unavailable");
        const data = await response.json();
        const layerValue = (name) => Number(data.properties?.layers?.find((layer) => layer.name === name)?.depths?.[0]?.values?.mean ?? 0) / 10;
        const clay = layerValue("clay"), sand = layerValue("sand"), silt = layerValue("silt");
        const type = clay >= 40 ? "Clay soil" : sand >= 70 ? "Sandy soil" : silt >= 80 ? "Silty soil" : "Loam soil";
        return { source: "ISRIC SoilGrids", type, clay, sand, silt };
      } catch {
        return { source: "Location estimate", type: "Loam soil", clay: null, sand: null, silt: null };
      }
    })
  }),
  weather: router({
    current: publicProcedure.input(z2.object({ latitude: z2.number(), longitude: z2.number() })).query(async ({ ctx, input }) => {
      try {
        return await fetchWeather(input.latitude, input.longitude, ownerId(ctx));
      } catch (error) {
        console.error("[Weather] provider failed", error);
        const cached = await getLatestWeatherSnapshot(ownerId(ctx), input.latitude, input.longitude);
        if (cached) return cached;
        throw error;
      }
    })
  }),
  location: router({
    search: publicProcedure.input(z2.object({ query: z2.string().min(2) })).mutation(async ({ input }) => {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("q", input.query);
      url.searchParams.set("limit", "1");
      url.searchParams.set("countrycodes", "in");
      const response = await fetch(url, { headers: { "User-Agent": "Kisaan-Kareer/1.0 farmer-dashboard" }, signal: AbortSignal.timeout(8e3) });
      if (!response.ok) throw new Error(`Location search returned ${response.status}`);
      const [place] = await response.json();
      if (!place) throw new TRPCError3({ code: "NOT_FOUND", message: "Location could not be found." });
      const address = place.address ?? {};
      const district = address.state_district ?? address.district ?? address.county;
      return { latitude: place.lat, longitude: place.lon, displayName: place.display_name ?? input.query, ...district ? { district, state: address.state ?? "India" } : {} };
    }),
    reverse: publicProcedure.input(z2.object({ latitude: z2.number(), longitude: z2.number() })).mutation(async ({ input }) => {
      const url = new URL("https://nominatim.openstreetmap.org/reverse");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("lat", String(input.latitude));
      url.searchParams.set("lon", String(input.longitude));
      url.searchParams.set("zoom", "18");
      url.searchParams.set("addressdetails", "1");
      const response = await fetch(url, { headers: { "User-Agent": "Kisaan-Kareer/1.0 farmer-dashboard" } });
      if (!response.ok) throw new Error(`Location provider returned ${response.status}`);
      const data = await response.json();
      const address = data.address ?? {};
      const village = address.village ?? address.hamlet ?? address.town ?? address.city ?? address.municipality ?? "Your area";
      const district = address.state_district ?? address.district ?? address.county ?? village;
      const state = address.state ?? "India";
      const country = address.country ?? "India";
      return { label: [village, district, state].filter((value, index, values) => value && values.indexOf(value) === index).join(", "), village, district, state, country, displayName: data.display_name ?? village };
    })
  }),
  voice: router({
    transcribe: publicProcedure.input(z2.object({ audioBase64: z2.string().min(20).max(24e6), language: z2.string().optional(), prompt: z2.string().optional() })).mutation(async ({ input }) => {
      const match = input.audioBase64.match(/^data:([^;]+);base64,(.+)$/);
      const mimeType = match?.[1] ?? "audio/webm";
      const encoded = match?.[2] ?? input.audioBase64;
      const buffer = Buffer.from(encoded, "base64");
      if (!buffer.length || buffer.length > 16 * 1024 * 1024) throw new TRPCError3({ code: "BAD_REQUEST", message: "Please record a shorter voice question." });
      const normalizedMimeType = mimeType.split(";", 1)[0].trim().toLowerCase();
      const result = await transcribeAudio({ audioBuffer: buffer, mimeType: normalizedMimeType, language: input.language === "hinglish" ? "hi" : input.language, prompt: input.prompt });
      if ("error" in result) throw new TRPCError3({ code: "BAD_REQUEST", message: `${result.error}${result.details ? `: ${result.details}` : ""}`, cause: result });
      return { text: result.text, language: result.language, duration: result.duration };
    })
  }),
  market: router({
    list: publicProcedure.input(z2.object({ district: z2.string().default("Meerut"), state: z2.string().default("Uttar Pradesh") })).query(({ ctx, input }) => fetchMarkets(input.district, input.state, ownerId(ctx))),
    refresh: publicProcedure.input(z2.object({ district: z2.string().min(2), state: z2.string().min(2) })).mutation(({ ctx, input }) => fetchMarkets(input.district, input.state, ownerId(ctx)))
  }),
  alerts: router({
    list: publicProcedure.query(async ({ ctx }) => {
      const rows = await getAlertsForOwner(ownerId(ctx));
      if (rows.length) return rows;
      return [
        { id: 1, kind: "weather", severity: "high", title: "High chance of rain in next 2 days", message: "Plan harvesting accordingly.", createdAt: new Date(Date.now() - 2 * 36e5), readAt: null },
        { id: 2, kind: "market", severity: "medium", title: "Price of mustard increased by 3%", message: "Good time to sell in Meerut mandi.", createdAt: new Date(Date.now() - 4 * 36e5), readAt: null },
        { id: 3, kind: "crop", severity: "high", title: "Possible fungal infection in wheat", message: "Check for yellowing leaves.", createdAt: new Date(Date.now() - 6 * 36e5), readAt: null }
      ];
    }),
    markRead: publicProcedure.input(z2.object({ id: z2.number() })).mutation(({ ctx, input }) => markAlertRead(ownerId(ctx), input.id))
  }),
  decision: router({
    current: publicProcedure.query(({ ctx }) => getRecommendation(ownerId(ctx)))
  }),
  chat: router({
    history: publicProcedure.query(({ ctx }) => getRecentChat(ownerId(ctx)))
  }),
  disease: router({
    recent: publicProcedure.query(({ ctx }) => getRecentDiseaseScans(ownerId(ctx))),
    analyze: publicProcedure.input(z2.object({ dataUrl: z2.string().min(20), mimeType: z2.string().default("image/jpeg") })).mutation(async ({ ctx, input }) => {
      const match = input.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) throw new Error("Please upload a valid image");
      const buffer = Buffer.from(match[2], "base64");
      const stored = await storagePut(`crop-images/${Date.now()}.jpg`, buffer, input.mimeType);
      try {
        const signedUrl = await storageGetSignedUrl(stored.key);
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a crop disease scout. Identify the most likely issue from the image, give confidence, severity, and three safe next steps. Do not claim certainty; advise a local agronomist for confirmation." },
            { role: "user", content: [{ type: "text", text: "Analyze this crop or leaf image." }, { type: "image_url", image_url: { url: signedUrl, detail: "high" } }] }
          ],
          maxTokens: 450
        });
        const raw = response.choices?.[0]?.message?.content;
        const diagnosis = typeof raw === "string" ? raw : "Possible fungal leaf spot. Isolate affected leaves and consult an agronomist.";
        await saveDiseaseScan({ ownerOpenId: ownerId(ctx), imageUrl: stored.url, diagnosis, source: "AI image analysis" });
        return { imageUrl: stored.url, diagnosis, source: "AI image analysis" };
      } catch (error) {
        console.error("[Disease] analysis failed", error);
        const diagnosis = "Image saved. The AI scout is unavailable right now; check for yellowing, lesions or curling and consult a local agronomist.";
        await saveDiseaseScan({ ownerOpenId: ownerId(ctx), imageUrl: stored.url, diagnosis, source: "Image saved \xB7 manual review needed" });
        return { imageUrl: stored.url, diagnosis, source: "Image saved \xB7 manual review needed" };
      }
    })
  }),
  assistant: router({
    ask: publicProcedure.input(z2.object({ question: z2.string().min(1), language: z2.string().default("en"), farmId: z2.number().optional(), history: z2.array(z2.object({ role: z2.enum(["user", "assistant"]), content: z2.string() })).default([]) })).mutation(async ({ ctx, input }) => {
      const farm = input.farmId ? await getFarmById(ownerId(ctx), input.farmId) : await getFarmByOwner(ownerId(ctx));
      const crop = await getPrimaryCrop(farm.id);
      const [allCrops, soilTest, treatments, irrigations] = await Promise.all([
        getCrops(farm.id),
        getLatestSoilTest(farm.id),
        getTreatmentHistory(farm.id),
        getIrrigationHistory(farm.id)
      ]);
      const languageNames = { en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu", mr: "Marathi", bn: "Bengali", gu: "Gujarati", kn: "Kannada", ml: "Malayalam", pa: "Punjabi", ur: "Urdu", hinglish: "Hinglish written in Roman script" };
      const responseLanguage = languageNames[input.language] ?? input.language;
      const fallbackAnswers = { hi: "\u092E\u093F\u091F\u094D\u091F\u0940 \u0915\u0940 \u0928\u092E\u0940 \u092A\u0939\u0932\u0947 \u091C\u093E\u0901\u091A\u0947\u0902 \u0914\u0930 \u0938\u0941\u092C\u0939 \u091C\u0932\u094D\u0926\u0940 \u0938\u093F\u0902\u091A\u093E\u0908 \u0915\u0930\u0947\u0902\u0964", ta: "\u0BAE\u0BC1\u0BA4\u0BB2\u0BBF\u0BB2\u0BCD \u0BAE\u0BA3\u0BCD\u0BA3\u0BBF\u0BA9\u0BCD \u0B88\u0BB0\u0BAA\u0BCD\u0BAA\u0BA4\u0BA4\u0BCD\u0BA4\u0BC8\u0B9A\u0BCD \u0B9A\u0BB0\u0BBF\u0BAA\u0BBE\u0BB0\u0BCD\u0BA4\u0BCD\u0BA4\u0BC1, \u0B85\u0BA4\u0BBF\u0B95\u0BBE\u0BB2\u0BC8\u0BAF\u0BBF\u0BB2\u0BCD \u0BA8\u0BC0\u0BB0\u0BCD\u0BAA\u0BCD\u0BAA\u0BBE\u0B9A\u0BA9\u0BAE\u0BCD \u0B9A\u0BC6\u0BAF\u0BCD\u0BAF\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD.", te: "\u0C2E\u0C41\u0C02\u0C26\u0C41\u0C17\u0C3E \u0C28\u0C47\u0C32 \u0C24\u0C47\u0C2E\u0C28\u0C41 \u0C2A\u0C30\u0C3F\u0C36\u0C40\u0C32\u0C3F\u0C02\u0C1A\u0C3F, \u0C09\u0C26\u0C2F\u0C02 \u0C28\u0C40\u0C30\u0C41 \u0C2A\u0C46\u0C1F\u0C4D\u0C1F\u0C02\u0C21\u0C3F.", mr: "\u0906\u0927\u0940 \u092E\u093E\u0924\u0940\u0924\u0940\u0932 \u0913\u0932\u093E\u0935\u093E \u0924\u092A\u093E\u0938\u093E \u0906\u0923\u093F \u0938\u0915\u093E\u0933\u0940 \u0932\u0935\u0915\u0930 \u092A\u093E\u0923\u0940 \u0926\u094D\u092F\u093E.", bn: "\u09AA\u09CD\u09B0\u09A5\u09AE\u09C7 \u09AE\u09BE\u099F\u09BF\u09B0 \u0986\u09B0\u09CD\u09A6\u09CD\u09B0\u09A4\u09BE \u09AA\u09B0\u09C0\u0995\u09CD\u09B7\u09BE \u0995\u09B0\u09C1\u09A8 \u098F\u09AC\u0982 \u09AD\u09CB\u09B0\u09C7 \u09B8\u09C7\u099A \u09A6\u09BF\u09A8\u0964", gu: "\u0AAA\u0AB9\u0AC7\u0AB2\u0ABE \u0A9C\u0AAE\u0AC0\u0AA8\u0AA8\u0AC0 \u0AAD\u0AC7\u0A9C \u0AA4\u0AAA\u0ABE\u0AB8\u0ACB \u0A85\u0AA8\u0AC7 \u0AB5\u0AB9\u0AC7\u0AB2\u0AC0 \u0AB8\u0AB5\u0ABE\u0AB0\u0AC7 \u0AB8\u0ABF\u0A82\u0A9A\u0ABE\u0A88 \u0A95\u0AB0\u0ACB.", kn: "\u0CAE\u0CCA\u0CA6\u0CB2\u0CC1 \u0CAE\u0CA3\u0CCD\u0CA3\u0CBF\u0CA8 \u0CA4\u0CC7\u0CB5\u0CBE\u0C82\u0CB6\u0CB5\u0CA8\u0CCD\u0CA8\u0CC1 \u0CAA\u0CB0\u0CBF\u0CB6\u0CC0\u0CB2\u0CBF\u0CB8\u0CBF \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CAE\u0CC1\u0C82\u0C9C\u0CBE\u0CA8\u0CC6 \u0CA8\u0CC0\u0CB0\u0CC1\u0CA3\u0CBF\u0CB8\u0CBF.", ml: "\u0D06\u0D26\u0D4D\u0D2F\u0D02 \u0D2E\u0D23\u0D4D\u0D23\u0D3F\u0D32\u0D46 \u0D08\u0D7C\u0D2A\u0D4D\u0D2A\u0D02 \u0D2A\u0D30\u0D3F\u0D36\u0D4B\u0D27\u0D3F\u0D1A\u0D4D\u0D1A\u0D4D \u0D05\u0D24\u0D3F\u0D30\u0D3E\u0D35\u0D3F\u0D32\u0D46 \u0D28\u0D28\u0D2F\u0D4D\u0D15\u0D4D\u0D15\u0D41\u0D15.", pa: "\u0A2A\u0A39\u0A3F\u0A32\u0A3E\u0A02 \u0A2E\u0A3F\u0A71\u0A1F\u0A40 \u0A26\u0A40 \u0A28\u0A2E\u0A40 \u0A1C\u0A3E\u0A02\u0A1A\u0A4B \u0A05\u0A24\u0A47 \u0A38\u0A35\u0A47\u0A30\u0A47 \u0A1C\u0A32\u0A26\u0A40 \u0A38\u0A3F\u0A70\u0A1A\u0A3E\u0A08 \u0A15\u0A30\u0A4B\u0964", ur: "\u067E\u06C1\u0644\u06D2 \u0645\u0679\u06CC \u06A9\u06CC \u0646\u0645\u06CC \u0686\u06CC\u06A9 \u06A9\u0631\u06CC\u06BA \u0627\u0648\u0631 \u0635\u0628\u062D \u0633\u0648\u06CC\u0631\u06D2 \u067E\u0627\u0646\u06CC \u062F\u06CC\u06BA\u06D4", hinglish: "Pehle mitti ki nami check karein aur subah jaldi paani dein." };
      await saveChat(ownerId(ctx), "user", input.question);
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: `You are Kisaan-Kareer, a practical farming decision companion for Indian farmers. MUST answer entirely in ${responseLanguage}; do not answer in English unless the requested language is English. Keep the language natural for a farmer, concise, and easy to understand. Give one clear action, timing, and reason. Do not switch languages unless needed for crop names or measurements. Use the saved farm profile below as the source of truth. Never invent profile values and never answer as if the farmer has no saved profile.

Saved farm profile:
- Farmer: ${farm.farmerName}
- Farm location: ${farm.location}
- District: ${farm.district}
- State: ${farm.state}
- Farm size: ${farm.farmSizeAcres} acres
- Irrigation method: ${farm.irrigationMethod}
- Irrigation frequency: ${farm.irrigationFrequency ?? "Not provided"}
- Farming preference: ${farm.farmingPreference}
- Soil type: ${farm.soilType ?? "Not provided"}
- Soil report available: ${Number(farm.soilReportAvailable ?? 0) === 1 ? "Yes" : "No"}
- Primary crop: ${crop.name}, variety ${crop.variety ?? "Not provided"}, stage ${crop.stage}, sowing date ${crop.sowingDate ?? "Not provided"}, harvest date ${crop.harvestDate ?? "Not provided"}, chemical ${crop.chemicalName ?? "Not provided"}
- All crops on this farm: ${allCrops.length ? allCrops.map((item) => `${item.name} (${item.variety ?? "variety not provided"}, ${item.stage})`).join("; ") : "Only the primary crop is recorded"}
- Latest soil test: ${soilTest ? `pH ${soilTest.ph ?? "not provided"}, nitrogen ${soilTest.nitrogen ?? "not provided"}, phosphorus ${soilTest.phosphorus ?? "not provided"}, potassium ${soilTest.potassium ?? "not provided"}, organic carbon ${soilTest.organicCarbon ?? "not provided"}` : "No soil test saved"}
- Recent treatment history: ${treatments.length ? treatments.slice(0, 5).map((item) => `${item.treatmentDate}: ${item.chemicalName}${item.quantity ? ` (${item.quantity})` : ""}`).join("; ") : "No treatment history saved"}
- Recent irrigation history: ${irrigations.length ? irrigations.slice(0, 5).map((item) => `${item.irrigationDate}: ${item.method ?? "method not provided"}${item.duration ? ` (${item.duration})` : ""}`).join("; ") : "No irrigation history saved"}` },
            ...input.history.map((item) => ({ role: item.role, content: item.content })),
            { role: "user", content: input.question }
          ],
          maxTokens: 350
        });
        const raw = response.choices?.[0]?.message?.content;
        let answer = typeof raw === "string" ? raw : "Check soil moisture before irrigation and avoid watering during midday.";
        if (input.language !== "en" && typeof raw === "string") {
          try {
            const translated = await invokeLLM({
              messages: [
                { role: "system", content: `Translate the farming answer below into ${responseLanguage}. Return only the translation. Do not use English, Punjabi, Hindi, or any other language unless ${responseLanguage} requires it. Preserve crop names, numbers, measurements, and markdown formatting.` },
                { role: "user", content: raw }
              ],
              maxTokens: 500
            });
            const translatedText = translated.choices?.[0]?.message?.content;
            if (typeof translatedText === "string" && translatedText.trim()) answer = translatedText.trim();
          } catch (translationError) {
            console.error("[Assistant] response translation failed", translationError);
          }
        }
        await saveChat(ownerId(ctx), "assistant", answer);
        return { answer, source: "Kisaan-Kareer AI decision engine" };
      } catch (error) {
        console.error("[Assistant] LLM request failed", error);
        const answer = fallbackAnswers[input.language] ?? "Based on your wheat crop and current farm conditions, check soil moisture first and water in the early morning. I\u2019ll keep this recommendation practical until the AI service reconnects.";
        await saveChat(ownerId(ctx), "assistant", answer);
        return { answer, source: "Farm rules fallback" };
      }
    })
  }),
  translation: router({
    translate: publicProcedure.input(z2.object({ language: z2.string().min(2), texts: z2.array(z2.string().min(1).max(500)).min(1).max(160) })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: `You are a professional translator for an Indian farmer dashboard. Translate each supplied UI string into ${input.language}. Preserve numbers, crop names, units, punctuation, and placeholders. Return only the requested JSON object.` },
          { role: "user", content: JSON.stringify(input.texts) }
        ],
        response_format: { type: "json_schema", json_schema: { name: "ui_translations", strict: true, schema: { type: "object", properties: { translations: { type: "array", items: { type: "string" } } }, required: ["translations"], additionalProperties: false } } },
        maxTokens: 4e3
      });
      const raw = response.choices?.[0]?.message?.content;
      if (typeof raw !== "string") throw new TRPCError3({ code: "BAD_GATEWAY", message: "Translation service returned no text" });
      const parsed = JSON.parse(raw);
      const translations = Array.isArray(parsed.translations) ? parsed.translations.map(String) : [];
      return { translations: input.texts.map((text2, index) => translations[index] ?? text2), language: input.language };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
