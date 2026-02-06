import type { NextFunction, Request, Response } from "express";
import { response_unauthorized } from "$utils/response.utils";
import { verifyJwt } from "$pkg/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return response_unauthorized(res, "Missing or invalid Authorization header");
  }

  try {
    const token = header.substring("Bearer ".length);
    const payload = verifyJwt(token);
    req.user = {
      id: payload.userId,
      role: payload.role
    };
    return next();
  } catch {
    return response_unauthorized(res, "Invalid token");
  }
}
