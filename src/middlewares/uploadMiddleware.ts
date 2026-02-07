import fs from "fs";
import path from "path";
import multer, { MulterError } from "multer";
import { response_bad_request, response_internal_server_error } from "$utils/response.utils";
import type { NextFunction, Request, Response } from "express";

const uploadDir = path.resolve(process.cwd(), "storage/uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_EXT = new Set([".xlsx", ".xls"]);

function safeFilename(originalName: string) {
  return originalName.replace(/[^\w.-]/g, "_");
}

function formatTimestamp(date = new Date()) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${y}${m}${d}-${hh}${mm}${ss}`;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const safeName = safeFilename(file.originalname);
    const ext = path.extname(safeName);
    const base = safeName.slice(0, safeName.length - ext.length);
    const stamp = formatTimestamp();
    cb(null, `${base}-${stamp}${ext}`);
  }
});

const uploadSingleFile = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return cb(new MulterError("LIMIT_UNEXPECTED_FILE", "file"));
    }
    return cb(null, true);
  }
}).single("file");

export function uploadSingleFileMiddleware(req: Request, res: Response, next: NextFunction) {
  uploadSingleFile(req, res, async (err) => {
    if (err) {
      if (err instanceof MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return response_bad_request(res, `File too large (max ${MAX_FILE_SIZE_MB}MB)`);
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return response_bad_request(res, "Invalid file type. Only .xlsx or .xls is allowed.");
        }
      }
      return response_bad_request(res, "File upload failed");
    }

    if (!req.file) return next();

    try {
      req.body = {
        ...req.body,
        fileUrl: `/storage/uploads/${req.file.filename}`
      };

      return next();
    } catch {
      return response_internal_server_error(res, "Failed to process uploaded file");
    }
  });
}
