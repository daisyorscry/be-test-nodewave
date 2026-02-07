import { Request, Response } from "express";
import * as UserService from "$services/UserService";
import * as ResponseUtils from "$utils/response.utils";
import type * as UserTypes from "$entities/user";
import { checkFilteringQueryV2 } from "$controllers/helpers/CheckFilteringQuery";

export async function list(req: Request, res: Response): Promise<Response> {
  const filter = checkFilteringQueryV2(req);
  if (req.query.q) {
    const q = req.query.q.toString();
    filter.searchFilters = {
      email: q,
      name: q
    };
  }
  const serviceResponse = await UserService.list(filter);

  if (!serviceResponse.status) return ResponseUtils.handleServiceErrorWithResponse(res, serviceResponse);

  return ResponseUtils.response_success(res, serviceResponse.data, "Success!");
}

export async function getById(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  const serviceResponse = await UserService.getById(id);

  if (!serviceResponse.status) return ResponseUtils.handleServiceErrorWithResponse(res, serviceResponse);

  return ResponseUtils.response_success(res, serviceResponse.data, "Success!");
}

export async function create(req: Request, res: Response): Promise<Response> {
  const payload = req.body as UserTypes.CreateUserRequestDTO;
  const serviceResponse = await UserService.create(payload);

  if (!serviceResponse.status) return ResponseUtils.handleServiceErrorWithResponse(res, serviceResponse);

  return ResponseUtils.response_created(res, serviceResponse.data, "Created");
}

export async function update(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);

  const payload = req.body as UserTypes.UpdateUserRequestDTO;
  const serviceResponse = await UserService.update(id, payload);

  if (!serviceResponse.status) return ResponseUtils.handleServiceErrorWithResponse(res, serviceResponse);

  return ResponseUtils.response_success(res, serviceResponse.data, "Updated");
}

export async function remove(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);

  const serviceResponse = await UserService.remove(id);

  if (!serviceResponse.status) return ResponseUtils.handleServiceErrorWithResponse(res, serviceResponse);

  return ResponseUtils.response_success(res, serviceResponse.data, "Deleted");
}
