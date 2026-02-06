import type { NextFunction, Request, Response } from "express";
import { response_forbidden } from "$utils/response.utils";

export function requireRole(roles: string | string[]) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return response_forbidden(res);
    }
    return next();
  };
}

export function requireSelfOrAdmin() {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    if (!req.user) return response_forbidden(res);
    if (req.user.role === "ADMIN" || req.user.id === id) {
      return next();
    }
    return response_forbidden(res);
  };
}

export function forbidRoleChangeForNonAdmin() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== "ADMIN" && req.body?.roleId !== undefined) {
      return response_forbidden(res);
    }
    return next();
  };
}
