import type { NextFunction, Request } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createResponseDouble } from "../../helpers/http";

const authServiceMock = {
  loginUser: vi.fn(),
  loginProfessional: vi.fn(),
  loginGymAdmin: vi.fn(),
  changePassword: vi.fn(),
};

vi.mock("../../../src/services/auth.service", () => ({
  AuthService: class {
    loginUser = authServiceMock.loginUser;
    loginProfessional = authServiceMock.loginProfessional;
    loginGymAdmin = authServiceMock.loginGymAdmin;
    changePassword = authServiceMock.changePassword;
  },
}));

describe("AuthController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when user login does not include gymId", async () => {
    const { AuthController } = await import(
      "../../../src/controllers/auth.controller"
    );
    const controller = new AuthController();
    const req = {
      body: { email: "user@gym.com", password: "secret1" },
    } as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    await controller.loginUser(req, res as never, next);

    expect(res.statusCode).toBe(400);
    expect(authServiceMock.loginUser).not.toHaveBeenCalled();
  });

  it("returns 200 when user login succeeds", async () => {
    authServiceMock.loginUser.mockResolvedValue({
      token: "token-123",
      user: { id: "user-1" },
    });

    const { AuthController } = await import(
      "../../../src/controllers/auth.controller"
    );
    const controller = new AuthController();
    const req = {
      body: {
        gymId: "550e8400-e29b-41d4-a716-446655440000",
        email: "user@gym.com",
        password: "secret1",
      },
    } as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    await controller.loginUser(req, res as never, next);

    expect(authServiceMock.loginUser).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000",
      "user@gym.com",
      "secret1",
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true });
  });

  it("forwards professional login errors to next", async () => {
    const error = new Error("Credenciais invÃ¡lidas");
    authServiceMock.loginProfessional.mockRejectedValue(error);

    const { AuthController } = await import(
      "../../../src/controllers/auth.controller"
    );
    const controller = new AuthController();
    const req = {
      body: {
        gymId: "550e8400-e29b-41d4-a716-446655440000",
        email: "prof@gym.com",
        password: "secret1",
      },
    } as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    await controller.loginProfessional(req, res as never, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("forwards admin login errors to next", async () => {
    const error = new Error("Credenciais invÃ¡lidas");
    authServiceMock.loginGymAdmin.mockRejectedValue(error);

    const { AuthController } = await import(
      "../../../src/controllers/auth.controller"
    );
    const controller = new AuthController();
    const req = {
      body: { email: "admin@gym.com", password: "secret1" },
    } as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    await controller.loginGymAdmin(req, res as never, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("changes password using the authenticated user context", async () => {
    authServiceMock.changePassword.mockResolvedValue(undefined);

    const { AuthController } = await import(
      "../../../src/controllers/auth.controller"
    );
    const controller = new AuthController();
    const req = {
      body: { currentPassword: "current", newPassword: "newpass" },
      user: { id: "user-1", gymId: "gym-1", role: "USER" },
    } as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    await controller.changePassword(req, res as never, next);

    expect(authServiceMock.changePassword).toHaveBeenCalledWith(
      "user-1",
      "USER",
      "current",
      "newpass",
    );
    expect(res.statusCode).toBe(200);
  });

  it("returns the authenticated user in me", async () => {
    const { AuthController } = await import(
      "../../../src/controllers/auth.controller"
    );
    const controller = new AuthController();
    const req = {
      user: { id: "user-1", gymId: "gym-1", role: "USER" },
    } as Request;
    const res = createResponseDouble();

    await controller.me(req, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { id: "user-1", gymId: "gym-1", role: "USER" },
    });
  });
});
