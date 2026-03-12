export type UserRole = "GYM_ADMIN" | "PROFESSIONAL" | "USER";

export interface JwtPayload {
  id: string;
  gymId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
