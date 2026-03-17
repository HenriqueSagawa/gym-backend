import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { UserService } from "../services/user.service";
import * as R from "../utils/response";

const userService = new UserService();
function q(val: unknown): string {
  return String(val ?? "");
}

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  password: z.string().min(6),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(300).optional(),
  birthDate: z.string().datetime().optional(),
  showInRanking: z.boolean().optional(),
});

export class UserController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createUserSchema.parse(req.body);
      const user = await userService.create({
        ...data,
        gymId: req.user!.gymId,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      });
      return R.created(res, user, "Usuário cadastrado com sucesso");
    } catch (error) {
      return next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createUserSchema.parse(req.body);
      const user = await userService.create({
        ...data,
        gymId: String(req.params.gymId),
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      });
      return R.created(res, user, "Cadastro realizado com sucesso");
    } catch (error) {
      return next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.findById(
        String(req.params.id),
        req.user!.gymId,
      );
      if (!user) return R.notFound(res, "Usuário não encontrado");
      return R.success(res, user);
    } catch (error) {
      return next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.findById(req.user!.id, req.user!.gymId);
      if (!user) return R.notFound(res, "Usuário não encontrado");
      return R.success(res, user);
    } catch (error) {
      return next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(q(req.query.page)) || 1;
      const limit = Number(q(req.query.limit)) || 20;
      const search = q(req.query.search) || undefined;
      const { users, total } = await userService.findAll(
        req.user!.gymId,
        page,
        limit,
        search,
      );
      return R.paginated(res, users, total, page, limit);
    } catch (error) {
      return next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateProfileSchema.parse(req.body);
      const userId =
        String(req.params.id) === "me" ? req.user!.id : String(req.params.id);
      const user = await userService.updateProfile(userId, req.user!.gymId, {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      });
      return R.success(res, user, "Perfil atualizado com sucesso");
    } catch (error) {
      return next(error);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.deactivate(String(req.params.id), req.user!.gymId);
      return R.success(res, "Usuário desativado com sucesso");
    } catch (error) {
      return next(error);
    }
  }
}
