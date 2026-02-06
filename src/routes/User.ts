import { Router } from "express";
import * as UserController from "$controllers/rest/UserController";
import { validateCreateUser, validateUpdateUser, validateUserIdParam } from "$validations/UserValidation";
import { requireAuth } from "$middlewares/authMiddleware";
import { forbidRoleChangeForNonAdmin, requireRole, requireSelfOrAdmin } from "$middlewares/roleMiddleware";
import { ROLES } from "$constants/roles";

const UserRoutes = Router({ mergeParams: true });

UserRoutes.use(requireAuth);
UserRoutes.get("/", requireRole(ROLES.ADMIN), UserController.list);
UserRoutes.get("/:id", validateUserIdParam, requireSelfOrAdmin(), UserController.getById);
UserRoutes.post("/", requireRole(ROLES.ADMIN), validateCreateUser, UserController.create);
UserRoutes.patch("/:id", validateUserIdParam, requireSelfOrAdmin(), forbidRoleChangeForNonAdmin(), validateUpdateUser, UserController.update);
UserRoutes.delete("/:id", validateUserIdParam, requireSelfOrAdmin(), UserController.remove);

export default UserRoutes;
