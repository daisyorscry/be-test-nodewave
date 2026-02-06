import { Router } from "express";
import * as AuthController from "$controllers/rest/AuthController";
import { validateLogin } from "$validations/AuthValidation";

const AuthRoutes = Router({ mergeParams: true });

AuthRoutes.post("/login", validateLogin, AuthController.login);

export default AuthRoutes;
