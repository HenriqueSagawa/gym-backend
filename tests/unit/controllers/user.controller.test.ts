import type { NextFunction, Request } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createResponseDouble } from "../../helpers/http";

const userServiceMock = {
  create: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  updateProfile: vi.fn(),
  deactivate: vi.fn(),
};

vi.mock("../../../src/services/user.service", () => ({
  UserService: class {
    create = userServiceMock.create;
    findById = userServiceMock.findById;
    findAll = userServiceMock.findAll;
    updateProfile = userServiceMock.updateProfile;
    deactivate = userServiceMock.deactivate;
  },
}));

describe("UserController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a user with gymId from the authenticated user and converts birthDate", async () => {
    userServiceMock.create.mockResolvedValue({ id: "user-1" });

    const { UserController } = await import(
      "../../../src/controllers/user.controller"
    );
    const controller = new UserController();
    const req = {
      body: {
        name: "User",
        email: "user@gym.com",
        password: "secret1",
        birthDate: "2024-01-15T00:00:00.000Z",
      },
      user: { id: "admin-1", gymId: "gym-1", role: "GYM_ADMIN" },
    } as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    await controller.create(req, res as never, next);

    expect(userServiceMock.create).toHaveBeenCalledWith({
      name: "User",
      email: "user@gym.com",
      password: "secret1",
      gymId: "gym-1",
      birthDate: new Date("2024-01-15T00:00:00.000Z"),
    });
    expect(res.statusCode).toBe(201);
  });

  it("returns 404 when getById does not find a user", async () => {
    userServiceMock.findById.mockResolvedValue(null);

    const { UserController } = await import(
      "../../../src/controllers/user.controller"
    );
    const controller = new UserController();
    const req = {
      params: { id: "user-1" },
      user: { id: "admin-1", gymId: "gym-1", role: "GYM_ADMIN" },
    } as unknown as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    await controller.getById(req, res as never, next);

    expect(userServiceMock.findById).toHaveBeenCalledWith("user-1", "gym-1");
    expect(res.statusCode).toBe(404);
  });

  it("returns the authenticated user in getMe", async () => {
    userServiceMock.findById.mockResolvedValue({ id: "user-1" });

    const { UserController } = await import(
      "../../../src/controllers/user.controller"
    );
    const controller = new UserController();
    const req = {
      user: { id: "user-1", gymId: "gym-1", role: "USER" },
    } as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    await controller.getMe(req, res as never, next);

    expect(userServiceMock.findById).toHaveBeenCalledWith("user-1", "gym-1");
    expect(res.statusCode).toBe(200);
  });

  it("lists users with default pagination when query params are missing", async () => {
    userServiceMock.findAll.mockResolvedValue({ users: [], total: 0 });

    const { UserController } = await import(
      "../../../src/controllers/user.controller"
    );
    const controller = new UserController();
    const req = {
      query: {},
      user: { id: "prof-1", gymId: "gym-1", role: "PROFESSIONAL" },
    } as unknown as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    await controller.list(req, res as never, next);

    expect(userServiceMock.findAll).toHaveBeenCalledWith("gym-1", 1, 20, undefined);
    expect(res.statusCode).toBe(200);
  });

  it("passes search and explicit pagination to the service", async () => {
    userServiceMock.findAll.mockResolvedValue({ users: [{ id: "user-1" }], total: 1 });

    const { UserController } = await import(
      "../../../src/controllers/user.controller"
    );
    const controller = new UserController();
    const req = {
      query: { page: "2", limit: "5", search: "alice" },
      user: { id: "prof-1", gymId: "gym-1", role: "PROFESSIONAL" },
    } as unknown as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    await controller.list(req, res as never, next);

    expect(userServiceMock.findAll).toHaveBeenCalledWith("gym-1", 2, 5, "alice");
    expect(res.body).toMatchObject({ success: true });
  });

  it("updates the authenticated user when route param is me", async () => {
    userServiceMock.updateProfile.mockResolvedValue({ id: "user-1" });

    const { UserController } = await import(
      "../../../src/controllers/user.controller"
    );
    const controller = new UserController();
    const req = {
      params: { id: "me" },
      body: { bio: "Updated bio" },
      user: { id: "user-1", gymId: "gym-1", role: "USER" },
    } as unknown as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    await controller.updateProfile(req, res as never, next);

    expect(userServiceMock.updateProfile).toHaveBeenCalledWith("user-1", "gym-1", {
      bio: "Updated bio",
      birthDate: undefined,
    });
    expect(res.statusCode).toBe(200);
  });

  it("deactivates a user using the route id", async () => {
    userServiceMock.deactivate.mockResolvedValue(undefined);

    const { UserController } = await import(
      "../../../src/controllers/user.controller"
    );
    const controller = new UserController();
    const req = {
      params: { id: "user-2" },
      user: { id: "admin-1", gymId: "gym-1", role: "GYM_ADMIN" },
    } as unknown as Request;
    const res = createResponseDouble();
    const next = vi.fn() as NextFunction;

    await controller.deactivate(req, res as never, next);

    expect(userServiceMock.deactivate).toHaveBeenCalledWith("user-2", "gym-1");
    expect(res.statusCode).toBe(200);
  });
});
