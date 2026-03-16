import { afterEach, describe, expect, it, vi } from "vitest";
import { makeJwtPayload } from "../../factories/jwt.factory";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

describe("jwt utils", () => {
  it("signs and verifies a token with the configured secret", async () => {
    process.env.JWT_SECRET = "unit-test-secret";
    process.env.JWT_EXPIRES_IN = "15m";

    const { signToken, verifyToken } = await import("../../../src/utils/jwt");
    const payload = makeJwtPayload();

    const token = signToken(payload);
    const decoded = verifyToken(token);

    expect(token).toEqual(expect.any(String));
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.gymId).toBe(payload.gymId);
    expect(decoded.role).toBe(payload.role);
  });
});
