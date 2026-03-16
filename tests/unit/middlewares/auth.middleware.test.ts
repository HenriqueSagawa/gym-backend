import type { NextFunction, Request } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createResponseDouble } from "../../helpers/http";
import { makeJwtPayload } from "../../factories/jwt.factory";

const verifyTokenMock = vi.fn();

vi.mock("../../../src/utils/jwt", () => ({
  verifyToken: verifyTokenMock,
}));

describe("auth middleware", () => {
  beforeEach(() => {
    verifyTokenMock.mockReset();
  });

  it("returns 401 when the authorization header is missing", async () => {
    const { authenticate } = await import(
      "../../../src/middlewares/auth.middleware"
    );
    const req = { headers: {} } as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    authenticate(req, res as never, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      error: "Token de autenticação não fornecido",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches the decoded user and calls next for a valid bearer token", async () => {
    verifyTokenMock.mockReturnValue(makeJwtPayload());

    const { authenticate } = await import(
      "../../../src/middlewares/auth.middleware"
    );
    const req = {
      headers: { authorization: "Bearer valid-token" },
    } as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    authenticate(req, res as never, next);

    expect(verifyTokenMock).toHaveBeenCalledWith("valid-token");
    expect(req.user).toEqual({
      id: "user-123",
      gymId: "gym-123",
      role: "USER",
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("returns 401 when token verification fails", async () => {
    verifyTokenMock.mockImplementation(() => {
      throw new Error("invalid token");
    });

    const { authenticate } = await import(
      "../../../src/middlewares/auth.middleware"
    );
    const req = {
      headers: { authorization: "Bearer invalid-token" },
    } as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    authenticate(req, res as never, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      error: "Token inválido ou expirado",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 in authorize when req.user is missing", async () => {
    const { authorize } = await import("../../../src/middlewares/auth.middleware");
    const middleware = authorize("GYM_ADMIN");
    const req = {} as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    middleware(req, res as never, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      error: "Token não fornecido",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 in authorize when the role is not allowed", async () => {
    const { authorize } = await import("../../../src/middlewares/auth.middleware");
    const middleware = authorize("GYM_ADMIN");
    const req = {
      user: { id: "user-123", gymId: "gym-123", role: "USER" },
    } as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    middleware(req, res as never, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({
      success: false,
      error: "Acesso negado",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next in authorize when the role is allowed", async () => {
    const { authorize } = await import("../../../src/middlewares/auth.middleware");
    const middleware = authorize("GYM_ADMIN", "PROFESSIONAL");
    const req = {
      user: { id: "prof-123", gymId: "gym-123", role: "PROFESSIONAL" },
    } as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    middleware(req, res as never, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });

  it("returns 403 in ensureSameGym when params gymId differs from req.user.gymId", async () => {
    const { ensureSameGym } = await import(
      "../../../src/middlewares/auth.middleware"
    );
    const req = {
      params: { gymId: "gym-999" },
      body: {},
      user: { id: "user-123", gymId: "gym-123", role: "USER" },
    } as unknown as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    ensureSameGym(req, res as never, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next in ensureSameGym when body gymId matches req.user.gymId", async () => {
    const { ensureSameGym } = await import(
      "../../../src/middlewares/auth.middleware"
    );
    const req = {
      params: {},
      body: { gymId: "gym-123" },
      user: { id: "user-123", gymId: "gym-123", role: "USER" },
    } as unknown as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    ensureSameGym(req, res as never, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
