import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { response_bad_request } from "$utils/response.utils";
import { generateErrorStructure } from "$validations/helper";

const loginSchema = z.object({
  email: z.string().min(1, "email is required").email("email must be a valid email"),
  password: z.string().min(1, "password is required")
});

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) =>
      generateErrorStructure(issue.path.join(".") || "body", issue.message)
    );
    return response_bad_request(res, "Validation error", errors);
  }

  req.body = parsed.data;
  return next();
}
