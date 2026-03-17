import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { GymPlan } from "../../generated/prisma/enums";
import { GymService } from "../services/gym.service";
import * as R from "../utils/response";

const gymService = new GymService();

const createGymSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.url().optional(),
  plan: z.enum(["BASIC", "PRO", "ENTERPRISE"]).optional(),
});

const updateGymSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.url().optional(),
});

const operatingHoursSchema = z.array(
  z.object({
    dayOfWeek: z.number().min(0).max(6),
    openTime: z.string().regex(/^\d{2}:\d{2}$/),
    closeTime: z.string().regex(/^\d{2}:\d{2}$/),
    isClosed: z.boolean(),
  }),
);

export class GymController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createGymSchema.parse(req.body);
      const data = Object.fromEntries(
        Object.entries(parsed).filter(([_, v]) => v !== undefined),
      ) as {
        name: string;
        email: string;
        phone?: string;
        address?: string;
        logoUrl?: string;
        plan?: GymPlan;
      };
      const gym = await gymService.create(data);
      return R.created(res, gym, "Academia criada com sucesso");
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const gym = await gymService.findById(String(req.params.gymId));
      if (!gym) return R.notFound(res, "Academia não encontrada");
      return R.success(res, gym);
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateGymSchema.parse(req.body);
      const data = Object.fromEntries(
        Object.entries(parsed).filter(([_, v]) => v !== undefined),
      ) as {
        name?: string;
        phone?: string;
        address?: string;
        logoUrl?: string;
      };
      const gym = await gymService.update(String(req.params.id), data);
      if (!gym) return R.notFound(res, "Academia não encontrada");
      return R.success(res, gym, "Academia atualizada com sucesso");
    } catch (error) {
      next(error);
    }
  }

  async getOperatingHours(req: Request, res: Response, next: NextFunction) {
    try {
      const hours = await gymService.getOperatingHours(req.user!.gymId);
      return R.success(res, hours);
    } catch (error) {
      next(error);
    }
  }

  async upsertOperatingHours(req: Request, res: Response, next: NextFunction) {
    try {
      const hours = operatingHoursSchema.parse(req.body);
      const result = await gymService.upsertOperatingHours(req.user!.gymId, hours);
      return R.success(res, result, "Horário atualizado com sucesso");
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await gymService.getStats(req.user!.id);
      return R.success(res, stats);
    } catch (error) {
      next(error);
    }
  }
}
