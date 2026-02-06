import type { JwtPayload } from "$pkg/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: JwtPayload["userId"];
        role: JwtPayload["role"];
      };
    }
  }
}

export {};
