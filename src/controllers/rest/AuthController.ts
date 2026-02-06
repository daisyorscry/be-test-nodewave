import type { Request, Response } from "express";
import * as AuthService from "$services/AuthService";
import * as ResponseUtils from "$utils/response.utils";

export async function login(req: Request, res: Response): Promise<Response> {
  const payload = req.body as { email: string; password: string };
  const serviceResponse = await AuthService.login(payload.email, payload.password);

  if (!serviceResponse.status) return ResponseUtils.handleServiceErrorWithResponse(res, serviceResponse);

  return ResponseUtils.response_success(res, serviceResponse.data, "Success");
}
