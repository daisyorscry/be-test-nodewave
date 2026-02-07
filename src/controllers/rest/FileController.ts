import type { Request, Response } from "express";
import * as FileService from "$services/FileService";
import * as ResponseUtils from "$utils/response.utils";
import { checkFilteringQueryV2 } from "$controllers/helpers/CheckFilteringQuery";

export async function list(req: Request, res: Response): Promise<Response> {
  const filter = checkFilteringQueryV2(req); 
  if (req.query.q) {
    const q = req.query.q.toString();
    filter.searchFilters = {
      fileUrl: q,
      status: q,
      errorMessage: q
    };
  }
  const serviceResponse = await FileService.list(filter);

  if (!serviceResponse.status) return ResponseUtils.handleServiceErrorWithResponse(res, serviceResponse);
  return ResponseUtils.response_success(res, serviceResponse.data, "Success!", serviceResponse.pagination);
}

export async function getById(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  const serviceResponse = await FileService.getById(id);

  if (!serviceResponse.status) return ResponseUtils.handleServiceErrorWithResponse(res, serviceResponse);
  return ResponseUtils.response_success(res, serviceResponse.data, "Success!");
}

export async function listRecords(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  const filter = checkFilteringQueryV2(req);
  if (req.query.q) {
    const q = req.query.q.toString();
    filter.searchFilters = {
      externalId: q,
      customerName: q,
      sentiment: q,
      reason: q,
      city: q,
      state: q,
      channel: q,
      responseTime: q,
      callCenter: q
    };
  }
  const serviceResponse = await FileService.listRecords(id, filter);

  if (!serviceResponse.status) return ResponseUtils.handleServiceErrorWithResponse(res, serviceResponse);
  return ResponseUtils.response_success(res, serviceResponse.data, "Success!");
}

export async function summary(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  const serviceResponse = await FileService.summary(id);

  if (!serviceResponse.status) return ResponseUtils.handleServiceErrorWithResponse(res, serviceResponse);
  return ResponseUtils.response_success(res, serviceResponse.data, "Success!");
}

export async function create(req: Request, res: Response): Promise<Response> {
  const payload = req.body as { fileUrl: string };
  const userId = req.user!.id;
  const serviceResponse = await FileService.create(payload, userId);

  if (!serviceResponse.status) return ResponseUtils.handleServiceErrorWithResponse(res, serviceResponse);
  return ResponseUtils.response_created(res, serviceResponse.data, "Created");
}

export async function retry(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  const serviceResponse = await FileService.retry(id);

  if (!serviceResponse.status) return ResponseUtils.handleServiceErrorWithResponse(res, serviceResponse);
  return ResponseUtils.response_success(res, serviceResponse.data, "Success!");
}
