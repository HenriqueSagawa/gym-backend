import type { Response } from "express";
import type { ApiResponse } from "../types";

export function success<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
) {
  const body: ApiResponse<T> = { success: true, data, message };
  return res.status(statusCode).json(body);
}

export function created<T>(
  res: Response,
  data: T,
  message = "Criado com sucesso",
) {
  return success(res, data, message, 201);
}

export function noContent(res: Response) {
  return res.status(204).send();
}

export function badResquest(res: Response, message: string) {
  return res.status(400).json({ success: false, error: message });
}

export function unauthorized(res: Response, message = "Não autorizado") {
  return res.status(401).json({ success: false, error: message });
}

export function forbidden(res: Response, message = "Acesso negado") {
  return res.status(403).json({ success: false, error: message });
}

export function notFound(res: Response, message = "Recurso não encontrado") {
  return res.status(404).json({ success: false, error: message });
}

export function conflict(res: Response, message: string) {
  return res.status(409).json({ success: false, error: message });
}

export function serverError(
  res: Response,
  message = "Erro interno do servidor",
) {
  return res.status(500).json({ success: false, error: message });
}

export function paginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return res.status(200).json({
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
