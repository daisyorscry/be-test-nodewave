import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { jwtEnv } from "$config/env";

const secret: Secret = jwtEnv.secret;

export interface JwtPayload {
  userId: number;
  role: string;
}

export function signJwt(payload: JwtPayload, expiresIn: SignOptions["expiresIn"] = "7d"): string {
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, secret) as JwtPayload;
}
