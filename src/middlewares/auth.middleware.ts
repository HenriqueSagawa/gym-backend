import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { unauthorized, forbidden } from "../utils/response";
import type { UserRole } from "../types";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        gymId: string;
        role: UserRole;
      };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorized(res, "Token de autenticação não fornecido");
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token as string);
    req.user = {
      id: payload.sub,
      gymId: payload.gymId,
      role: payload.role,
    };
    return next();
  } catch {
    return unauthorized(res, "Token inválido ou expirado");
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return unauthorized(res, "Token não fornecido");
    if (!roles.includes(req.user.role)) return forbidden(res, "Acesso negado");
    return next();
  };
}

export function ensureSameGym(req: Request, res: Response, next: NextFunction) {
  const gymId = req.params.gymId || req.body.gymId;
  if (gymId && req.user?.gymId !== gymId) {
    return forbidden(res, "Acesso negado");
  }
  return next();
}
