import jwt from "jsonwebtoken";
import { UserRole } from "@/types/enums";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface JwtPayload {
  userId: string;
  role: UserRole;
  type: "access" | "refresh";
}

export function signAccessToken(payload: Omit<JwtPayload, "type">) {
  return jwt.sign({ ...payload, type: "access" }, JWT_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: Omit<JwtPayload, "type">) {
  return jwt.sign({ ...payload, type: "refresh" }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
}
