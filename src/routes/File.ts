import { Router } from "express";
import * as FileController from "$controllers/rest/FileController";
import { requireAuth } from "$middlewares/authMiddleware";
import { requireRole } from "$middlewares/roleMiddleware";
import { validateCreateFile, validateFileIdParam } from "$validations/FileValidation";

const FileRoutes = Router({ mergeParams: true });

FileRoutes.use(requireAuth);
FileRoutes.get("/", FileController.list);
FileRoutes.get("/:id", validateFileIdParam, FileController.getById);
FileRoutes.get("/:id/records", validateFileIdParam, FileController.listRecords);
FileRoutes.get("/:id/summary", validateFileIdParam, FileController.summary);
FileRoutes.post("/", requireRole("ADMIN"), validateCreateFile, FileController.create);
FileRoutes.post("/:id/retry", requireRole("ADMIN"), validateFileIdParam, FileController.retry);

export default FileRoutes;
