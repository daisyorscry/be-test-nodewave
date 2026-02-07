import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { response_bad_request } from "$utils/response.utils";
import { generateErrorStructure } from "$validations/helper";

const createFileSchema = z.object({
  fileUrl: z
    .string()
    .min(1, "fileUrl is required")
    .refine(
      (val) =>
        val.startsWith("http://") ||
        val.startsWith("https://") ||
        val.startsWith("file://") ||
        val.startsWith("/") ||
        val.startsWith("./") ||
        val.startsWith("../"),
      "fileUrl must be a URL or local path"
    )
});

const fileIdParamSchema = z.object({
  id: z.preprocess(
    (val) => (typeof val === "string" ? Number(val) : val),
    z.number().int().positive({ message: "id must be a positive number" })
  )
});

export function validateCreateFile(req: Request, res: Response, next: NextFunction) {
  if (req.body?.fileUrl) {
    return next();
  }

  if (req.file) {
    req.body = { fileUrl: `file://${req.file.path}` };
    return next();
  }

  const parsed = createFileSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) =>
      generateErrorStructure(issue.path.join(".") || "body", issue.message)
    );
    return response_bad_request(res, "Validation error", errors);
  }
  req.body = parsed.data;
  return next();
}

export function validateFileIdParam(req: Request, res: Response, next: NextFunction) {
  const parsed = fileIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) =>
      generateErrorStructure(issue.path.join(".") || "params", issue.message)
    );
    return response_bad_request(res, "Validation error", errors);
  }
  req.params = { ...req.params, id: String(parsed.data.id) };
  return next();
}
