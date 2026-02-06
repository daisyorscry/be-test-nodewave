import { Router } from "express";
import * as UserController from "$controllers/rest/UserController";
import { validateCreateUser, validateUpdateUser, validateUserIdParam } from "$validations/UserValidation";

const UserRoutes = Router({ mergeParams: true });

UserRoutes.get("/", UserController.list);
UserRoutes.get("/:id", validateUserIdParam, UserController.getById);
UserRoutes.post("/", validateCreateUser, UserController.create);
UserRoutes.patch("/:id", validateUserIdParam, validateUpdateUser, UserController.update);
UserRoutes.delete("/:id", validateUserIdParam, UserController.remove);

export default UserRoutes;
