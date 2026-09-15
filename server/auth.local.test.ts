import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { sdk } from "./_core/sdk";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";
import { hashPassword, verifyPassword } from "./password";
import { COOKIE_NAME } from "@shared/const";

const user = {
  id: 42,
  openId: "local-test-user",
  name: "Test Farmer",
  email: "farmer@example.com",
  passwordHash: "stored-hash",
  loginMethod: "email",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createContext() {
  const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  const ctx = {
    user: null,
    req: { protocol: "https", headers: {} },
    res: { clearCookie: vi.fn(), cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }) },
  } as unknown as TrpcContext;
  return { ctx, cookies };
}

describe("local email authentication", () => {
  afterEach(() => vi.restoreAllMocks());

  it("hashes passwords without storing the raw password", async () => {
    const encoded = await hashPassword("strong-password");
    expect(encoded).toMatch(/^scrypt:[^:]+:[a-f0-9]+$/);
    expect(encoded).not.toContain("strong-password");
    expect(await verifyPassword("strong-password", encoded)).toBe(true);
    expect(await verifyPassword("wrong-password", encoded)).toBe(false);
  });

  it("creates an account and issues a secure session cookie", async () => {
    vi.spyOn(db, "getUserByEmail").mockResolvedValue(undefined);
    vi.spyOn(db, "createLocalUser").mockResolvedValue(user);
    vi.spyOn(db, "upsertFarm").mockResolvedValue({ ...db.demoFarm, ownerOpenId: user.openId, farmerName: user.name ?? "Test Farmer" });
    vi.spyOn(sdk, "signSession").mockResolvedValue("signed-session");
    const { ctx, cookies } = createContext();
    const result = await appRouter.createCaller(ctx).auth.signup({ name: "Test Farmer", email: "Farmer@Example.com", password: "strong-password" });
    expect(result.user).toMatchObject({ openId: user.openId, email: user.email });
    expect(cookies[0]).toMatchObject({ name: COOKIE_NAME, value: "signed-session" });
    expect(db.createLocalUser).toHaveBeenCalledWith(expect.objectContaining({ email: "farmer@example.com", name: "Test Farmer" }));
  });

  it("rejects an invalid password without issuing a session", async () => {
    vi.spyOn(db, "getUserByEmail").mockResolvedValue({ ...user, passwordHash: await hashPassword("correct-password") });
    const { ctx, cookies } = createContext();
    await expect(appRouter.createCaller(ctx).auth.signin({ email: user.email, password: "wrong-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(cookies).toHaveLength(0);
  });
});
