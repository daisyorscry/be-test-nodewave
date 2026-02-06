import type { Request } from "express";
import { ROLES } from "$constants/roles";

export function getAuthContext(req: Request) {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === ROLES.ADMIN;
  return { userId, isAdmin };
}
