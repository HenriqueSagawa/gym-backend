import "dotenv/config";
import { describe, expect, it } from "vitest";

describe("environment config", () => {
  it.each([
    "PORT",
    "DATABASE_URL",
    "JWT_SECRET",
    "JWT_EXPIRES_IN",
    "CORS_ORIGIN",
  ])("loads %s from environment", (envKey) => {
    expect(process.env[envKey]).toBeTypeOf("string");
    expect(process.env[envKey]?.trim()).not.toBe("");
  });

  it("loads PORT as a valid number", () => {
    expect(Number(process.env.PORT)).toBeGreaterThan(0);
  });

  it("loads DATABASE_URL in a postgres-compatible format", () => {
    expect(process.env.DATABASE_URL).toMatch(/^postgres(ql)?:\/\//);
  });
});
