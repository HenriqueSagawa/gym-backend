import { prisma } from "../config/database";
import { GymPlan } from "../../generated/prisma/enums";

export class GymService {
  async create(data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    logoUrl?: string;
    plan?: GymPlan;
  }) {
    return prisma.gym.create({ data });
  }

  async findById(id: string) {
    return prisma.gym.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            professionals: true,
            equipment: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      phone?: string;
      address?: string;
      logoUrl?: string;
      plan?: GymPlan;
    },
  ) {
    return prisma.gym.update({
      where: { id },
      data,
    });
  }

  async getOperatingHours(gymId: string) {
    return prisma.operatingHours.findMany({
      where: { gymId },
      orderBy: { dayOfWeek: "asc" },
    });
  }

  async upsertOperatingHours(
    gymId: string,
    hours: Array<{
      dayOfWeek: number;
      openTime: string;
      closeTime: string;
      isClosed?: boolean;
    }>,
  ) {
    const ops = hours.map((h) =>
      prisma.operatingHours.upsert({
        where: { gymId_dayOfWeek: { gymId, dayOfWeek: h.dayOfWeek } },
        update: {
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed ?? false,
        },
        create: { gymId, ...h },
      }),
    );
    return prisma.$transaction(ops);
  }

  async getStats(gymId: string) {
    const [
      totalUsers,
      totalProfessionals,
      totalEquipment,
      activeWorkouts,
      pendingRequests,
    ] = await Promise.all([
      prisma.user.count({ where: { gymId, isActive: true } }),
      prisma.professional.count({ where: { gymId, isActive: true } }),
      prisma.equipment.count({ where: { gymId } }),
      prisma.workout.count({ where: { request: { gymId }, isActive: true } }),
      prisma.workoutRequest.count({ where: { gymId, status: "PENDING" } }),
    ]);
    return {
      totalUsers,
      totalProfessionals,
      totalEquipment,
      activeWorkouts,
      pendingRequests,
    };
  }
}
