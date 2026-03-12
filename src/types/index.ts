export type UserRole = "GYM_ADMIN" | "PROFESSIONAL" | "USER";

export interface JwtPayload {
  sub: string;
  gymId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
