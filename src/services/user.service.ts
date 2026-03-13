import { prisma } from "../config/database";
import type { Prisma } from "../../generated/prisma/client";
import bcrypt from "bcrypt";

export class UserService {
  async create(data: {
    gymId: string;
    name: string;
    email: string;
    phone?: string | undefined;
    birthDate?: Date | undefined;
    password: string;
  }) {
    const exists = await prisma.user.findUnique({
      where: { gymId_email: { gymId: data.gymId, email: data.email } },
    });
    if (exists) throw new Error("Email já cadastrado");

    const passwordHash = await bcrypt.hash(data.password, 12);
    const { password: _, ...rest } = data;

    const user = await prisma.user.create({
      data: {
        ...rest,
        passwordHash,
        phone: rest.phone ?? null,
        birthDate: rest.birthDate ?? null,
      },
    });

    const { passwordHash: __, ...userData } = user;
    return userData;
  }

  async findById(id: string, gymId: string) {
    return prisma.user.findFirst({
      where: { id, gymId },
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
  }

  async findAll(gymId: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = {
      gymId,
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
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
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async updateProfile(
    id: string,
    gymId: string,
    data: {
      name?: string | undefined;
      phone?: string | undefined;
      avatarUrl?: string | undefined;
      bio?: string | undefined;
      birthDate?: Date | undefined;
      showInRanking?: boolean | undefined;
    },
  ) {
    const updateData: Prisma.UserUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate;
    if (data.showInRanking !== undefined)
      updateData.showInRanking = data.showInRanking;

    return prisma.user.update({
      where: { id },
      data: updateData,
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
  }

  async deactivate(id: string, gymId: string) {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
