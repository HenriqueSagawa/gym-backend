import { beforeEach, describe, expect, it, vi } from "vitest";

const hashMock = vi.fn();

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("bcrypt", () => ({
  default: {
    hash: hashMock,
  },
}));

vi.mock("../../../src/config/database", () => ({
  prisma: prismaMock,
}));

describe("UserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a user, hashes the password and omits passwordHash from the response", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    hashMock.mockResolvedValue("hashed-password");
    prismaMock.user.create.mockResolvedValue({
      id: "user-1",
      gymId: "gym-1",
      name: "User",
      email: "user@gym.com",
      phone: null,
      birthDate: null,
      passwordHash: "hashed-password",
    });

    const { UserService } = await import("../../../src/services/user.service");
    const service = new UserService();

    const result = await service.create({
      gymId: "gym-1",
      name: "User",
      email: "user@gym.com",
      password: "secret",
    });

    expect(hashMock).toHaveBeenCalledWith("secret", 12);
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        gymId: "gym-1",
        name: "User",
        email: "user@gym.com",
        passwordHash: "hashed-password",
        phone: null,
        birthDate: null,
      },
    });
    expect(result).toEqual({
      id: "user-1",
      gymId: "gym-1",
      name: "User",
      email: "user@gym.com",
      phone: null,
      birthDate: null,
    });
  });

  it("rejects user creation when the email is already registered", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "existing-user" });

    const { UserService } = await import("../../../src/services/user.service");
    const service = new UserService();

    await expect(
      service.create({
        gymId: "gym-1",
        name: "User",
        email: "user@gym.com",
        password: "secret",
      }),
    ).rejects.toThrow("Email já cadastrado");

    expect(hashMock).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("finds a user by id scoped to the gym", async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: "user-1" });

    const { UserService } = await import("../../../src/services/user.service");
    const service = new UserService();

    await service.findById("user-1", "gym-1");

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: { id: "user-1", gymId: "gym-1" },
      select: {
        id: true,
        gymId: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        birthDate: true,
        isActive: true,
        showInRanking: true,
        createdAt: true,
      },
    });
  });

  it("lists active users with pagination and search filters", async () => {
    prismaMock.user.findMany.mockResolvedValue([{ id: "user-1" }]);
    prismaMock.user.count.mockResolvedValue(1);

    const { UserService } = await import("../../../src/services/user.service");
    const service = new UserService();

    const result = await service.findAll("gym-1", 2, 10, "alice");

    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      where: {
        gymId: "gym-1",
        isActive: true,
        OR: [
          { name: { contains: "alice", mode: "insensitive" } },
          { email: { contains: "alice", mode: "insensitive" } },
        ],
      },
      skip: 10,
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
    expect(prismaMock.user.count).toHaveBeenCalledWith({
      where: {
        gymId: "gym-1",
        isActive: true,
        OR: [
          { name: { contains: "alice", mode: "insensitive" } },
          { email: { contains: "alice", mode: "insensitive" } },
        ],
      },
    });
    expect(result).toEqual({ users: [{ id: "user-1" }], total: 1 });
  });

  it("updates only the provided profile fields", async () => {
    prismaMock.user.update.mockResolvedValue({ id: "user-1" });

    const { UserService } = await import("../../../src/services/user.service");
    const service = new UserService();

    await service.updateProfile("user-1", "gym-1", {
      name: "Updated",
      showInRanking: false,
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        name: "Updated",
        showInRanking: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        birthDate: true,
        showInRanking: true,
      },
    });
  });

  it("deactivates a user", async () => {
    prismaMock.user.update.mockResolvedValue({ id: "user-1", isActive: false });

    const { UserService } = await import("../../../src/services/user.service");
    const service = new UserService();

    await service.deactivate("user-1", "gym-1");

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { isActive: false },
    });
  });
});
