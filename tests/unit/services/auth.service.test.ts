import { beforeEach, describe, expect, it, vi } from "vitest";

const compareMock = vi.fn();
const hashMock = vi.fn();
const signTokenMock = vi.fn();

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  professional: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  gym: {
    findUnique: vi.fn(),
  },
};

vi.mock("bcrypt", () => ({
  default: {
    compare: compareMock,
    hash: hashMock,
  },
}));

vi.mock("../../../src/config/database", () => ({
  prisma: prismaMock,
}));

vi.mock("../../../src/utils/jwt", () => ({
  signToken: signTokenMock,
}));

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in an active user and omits passwordHash from the response", async () => {
    const user = {
      id: "user-1",
      gymId: "gym-1",
      email: "user@gym.com",
      name: "User",
      passwordHash: "hashed-password",
      isActive: true,
    };

    prismaMock.user.findUnique.mockResolvedValue(user);
    compareMock.mockResolvedValue(true);
    signTokenMock.mockReturnValue("token-123");

    const { AuthService } = await import("../../../src/services/auth.service");
    const service = new AuthService();

    const result = await service.loginUser("gym-1", "user@gym.com", "secret");

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { gymId_email: { gymId: "gym-1", email: "user@gym.com" } },
    });
    expect(compareMock).toHaveBeenCalledWith("secret", "hashed-password");
    expect(signTokenMock).toHaveBeenCalledWith({
      sub: "user-1",
      gymId: "gym-1",
      role: "USER",
    });
    expect(result).toEqual({
      token: "token-123",
      user: {
        id: "user-1",
        gymId: "gym-1",
        email: "user@gym.com",
        name: "User",
        isActive: true,
      },
    });
  });

  it("rejects login when the user is inactive", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      gymId: "gym-1",
      passwordHash: "hashed-password",
      isActive: false,
    });

    const { AuthService } = await import("../../../src/services/auth.service");
    const service = new AuthService();

    await expect(
      service.loginUser("gym-1", "user@gym.com", "secret"),
    ).rejects.toThrow("Credenciais inválidas");

    expect(compareMock).not.toHaveBeenCalled();
  });

  it("rejects professional login when the password is invalid", async () => {
    prismaMock.professional.findUnique.mockResolvedValue({
      id: "prof-1",
      gymId: "gym-1",
      passwordHash: "hashed-password",
      isActive: true,
    });
    compareMock.mockResolvedValue(false);

    const { AuthService } = await import("../../../src/services/auth.service");
    const service = new AuthService();

    await expect(
      service.loginProfessional("gym-1", "prof@gym.com", "wrong"),
    ).rejects.toThrow("Credenciais inválidas");

    expect(signTokenMock).not.toHaveBeenCalled();
  });

  it("logs in an active gym admin using the professional admin account", async () => {
    prismaMock.gym.findUnique.mockResolvedValue({
      id: "gym-1",
      email: "admin@gym.com",
      isActive: true,
    });
    prismaMock.professional.findFirst.mockResolvedValue({
      id: "prof-1",
      gymId: "gym-1",
      email: "admin@gym.com",
      passwordHash: "hashed-password",
      isActive: true,
    });
    compareMock.mockResolvedValue(true);
    signTokenMock.mockReturnValue("admin-token");

    const { AuthService } = await import("../../../src/services/auth.service");
    const service = new AuthService();

    const result = await service.loginGymAdmin("admin@gym.com", "secret");

    expect(prismaMock.professional.findFirst).toHaveBeenCalledWith({
      where: { gymId: "gym-1", email: "admin@gym.com", isActive: true },
    });
    expect(signTokenMock).toHaveBeenCalledWith({
      sub: "prof-1",
      gymId: "gym-1",
      role: "GYM_ADMIN",
    });
    expect(result).toEqual({
      token: "admin-token",
      gym: {
        id: "gym-1",
        email: "admin@gym.com",
        isActive: true,
      },
    });
  });

  it("hashes passwords with 12 salt rounds", async () => {
    hashMock.mockResolvedValue("new-hash");

    const { AuthService } = await import("../../../src/services/auth.service");
    const service = new AuthService();

    await expect(service.hashPassword("secret")).resolves.toBe("new-hash");
    expect(hashMock).toHaveBeenCalledWith("secret", 12);
  });

  it("changes the password for a user role", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      passwordHash: "old-hash",
    });
    compareMock.mockResolvedValue(true);
    hashMock.mockResolvedValue("new-hash");

    const { AuthService } = await import("../../../src/services/auth.service");
    const service = new AuthService();

    await service.changePassword("user-1", "USER", "current", "new-secret");

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { passwordHash: "new-hash" },
    });
  });

  it("changes the password for a professional role", async () => {
    prismaMock.professional.findUnique.mockResolvedValue({
      id: "prof-1",
      passwordHash: "old-hash",
    });
    compareMock.mockResolvedValue(true);
    hashMock.mockResolvedValue("new-hash");

    const { AuthService } = await import("../../../src/services/auth.service");
    const service = new AuthService();

    await service.changePassword(
      "prof-1",
      "PROFESSIONAL",
      "current",
      "new-secret",
    );

    expect(prismaMock.professional.update).toHaveBeenCalledWith({
      where: { id: "prof-1" },
      data: { passwordHash: "new-hash" },
    });
  });

  it("rejects password change when the current password is invalid", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      passwordHash: "old-hash",
    });
    compareMock.mockResolvedValue(false);

    const { AuthService } = await import("../../../src/services/auth.service");
    const service = new AuthService();

    await expect(
      service.changePassword("user-1", "USER", "wrong", "new-secret"),
    ).rejects.toThrow("Senha atual inválida");

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
