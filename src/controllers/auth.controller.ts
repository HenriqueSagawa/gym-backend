import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthService } from "../services/auth.service";
import * as R from "../utils/response";

const authService = new AuthService();

const loginSchema = z.object({
  gymId: z.uuid().optional(),
  email: z.email(),
  password: z.string().min(6),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

export class AuthController {
  async loginUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { gymId, email, password } = loginSchema.parse(req.body);
      if (!gymId)
        return R.badResquest(res, "gymId é obrigatório para login de aluno");
      const result = await authService.loginUser(gymId, email, password);
      return R.success(res, result, "Login realizado com sucesso");
    } catch (error) {
      return R.forbidden(res);
    }
  }

  async loginProfessional(req: Request, res: Response, next: NextFunction) {
    try {
      const { gymId, email, password } = loginSchema.parse(req.body);
      if (!gymId) return R.badResquest(res, "gymId é obrigatório");
      const result = await authService.loginProfessional(
        gymId,
        email,
        password,
      );
      return R.success(res, result, "Login realizado com sucesso");
    } catch (error) {
      return next(error);
    }
  }

  async loginGymAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await authService.loginGymAdmin(email, password);
      return R.success(res, result, "Login realizado com sucesso");
    } catch (error) {
      return next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(
        req.body,
      );
      await authService.changePassword(
        req.user!.id,
        req.user!.role!,
        currentPassword,
        newPassword,
      );
      return R.success(res, null, "Senha alterada com sucesso");
    } catch (error) {
      return next(error);
    }
  }

  async me(req: Request, res: Response) {
    return R.success(res, req.user);
  }
}
