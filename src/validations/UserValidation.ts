import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { response_bad_request } from "$utils/response.utils";
import { generateErrorStructure } from "$validations/helper";
import type { CreateUserRequestDTO, UpdateUserRequestDTO } from "$entities/user";

export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, "email is required")
    .email("email must be a valid email"),
  name: z.string().nullable().optional(),
  roleId: z.preprocess(
    (val) => (typeof val === "string" ? Number(val) : val),
    z
      .number()
      .refine((v) => !Number.isNaN(v), { message: "roleId must be a number" })
      .int("roleId must be an integer")
      .positive("roleId must be a positive number")
  )
}) satisfies z.ZodType<CreateUserRequestDTO>;

export const updateUserSchema = z.object({
  email: z.string().email("email must be a valid email").optional(),
  name: z.string().nullable().optional(),
  roleId: z
    .preprocess(
      (val) => (typeof val === "string" ? Number(val) : val),
      z
        .number()
        .refine((v) => !Number.isNaN(v), { message: "roleId must be a number" })
        .int("roleId must be an integer")
        .positive("roleId must be a positive number")
    )
    .optional()
}) satisfies z.ZodType<UpdateUserRequestDTO>;

export const userIdParamSchema = z.object({
  id: z.preprocess(
    (val) => (typeof val === "string" ? Number(val) : val),
    z
      .number()
      .refine((v) => !Number.isNaN(v), { message: "id must be a number" })
      .int({ message: "id must be an integer" })
      .positive({ message: "id must be a positive number" })
  )
});

export function validateCreateUser(req: Request, res: Response, next: NextFunction) {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      const field = issue.path.join(".") || "body";
      return generateErrorStructure(field, issue.message);
    });
    return response_bad_request(res, "Validation error", errors);
  }

  req.body = parsed.data as CreateUserRequestDTO;
  return next();
}

export function validateUpdateUser(req: Request, res: Response, next: NextFunction) {
  const parsed = updateUserSchema.safeParse(req.body);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) =>
      generateErrorStructure(issue.path.join(".") || "body", issue.message)
    );
    return response_bad_request(res, "Validation error", errors);
  }

  if (Object.keys(parsed.data).length === 0) {
    return response_bad_request(res, "Validation error", [
      generateErrorStructure("body", "at least one field must be provided")
    ]);
  }

  req.body = parsed.data as UpdateUserRequestDTO;
  return next();
}

export function validateUserIdParam(req: Request, res: Response, next: NextFunction) {
  const parsed = userIdParamSchema.safeParse(req.params);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      const message =
        issue.code === "invalid_type" || issue.code === "custom"
          ? "id must be a number"
          : issue.message;
      return generateErrorStructure(issue.path.join(".") || "params", message);
    });
    return response_bad_request(res, "Validation error", errors);
  }

  req.params = { ...req.params, id: String(parsed.data.id) };
  return next();
}
