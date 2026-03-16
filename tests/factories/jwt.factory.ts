import type { JwtPayload } from "../../src/types";

export function makeJwtPayload(
  overrides: Partial<JwtPayload> = {},
): JwtPayload {
  return {
    sub: "user-123",
    gymId: "gym-123",
    role: "USER",
    ...overrides,
  };
}
