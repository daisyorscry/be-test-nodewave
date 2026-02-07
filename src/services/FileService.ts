import * as Service from "$entities/Service";
import type * as FileTypes from "$entities/file";
import * as FileRepo from "$repositories/FileRepository";
import * as FileMapper from "$mappers/FileMapper";
import { cursorFilterBuilder } from "$services/helpers/Query";
import type { FilteringQueryV2 } from "$entities/Query";
import { queueCallCenterJob } from "$queues/callCenterQueue";
import * as CallCenterRepo from "$repositories/CallCenterRepository";
import * as CallCenterMapper from "$mappers/CallCenterMapper";
import type * as CallCenterTypes from "$entities/callcenter";
import { cacheGet, cacheSet } from "$utils/cache.utils";
import Logger from "$pkg/logger";
import { prisma } from "$utils/prisma.utils";
import type { Prisma } from "@prisma/client";
import { FILE_STATUS } from "$constants/fileStatus";

const FILE_SEARCH_FIELDS = ["fileUrl", "status", "errorMessage"];
const RECORD_SEARCH_FIELDS = [
  "externalId",
  "customerName",
  "sentiment",
  "reason",
  "city",
  "state",
  "channel",
  "responseTime",
  "callCenter"
];

export async function list(
  filter?: FilteringQueryV2
): Promise<Service.ServiceResponse<FileTypes.FileListResponseDTO>> {
  try {
    const repo = FileRepo.getFileRepo();
    const page =
      Number.isFinite(filter?.page) && (filter?.page as number) > 0 ? (filter?.page as number) : 1;
    const rows =
      Number.isFinite(filter?.rows) && (filter?.rows as number) > 0 ? (filter?.rows as number) : 10;
    const query = cursorFilterBuilder(filter ?? {}, FILE_SEARCH_FIELDS)
      .all()
      .offset()
      .build();
    const files = await repo.listFiles(query);
    const totalRows = await repo.countFiles(query.where);
    const totalPages = totalRows ? Math.max(1, Math.ceil(totalRows / rows)) : 0;
    return Service.SuccessResponse(
      { files: files.map(FileMapper.toFileDTO) },
      { page, rows, totalRows, totalPages }
    );
  } catch (err) {
    Logger.error(`FileService.list : ${err}`);
    return Service.INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function getById(
  fileId: number,
  userId: number,
  isAdmin: boolean
): Promise<Service.ServiceResponse<FileTypes.FileDetailResponseDTO>> {
  /** Get file by id with access control (not cached) */
  try {
    const repo = FileRepo.getFileRepo();
  const file = await repo.getFileById(fileId);
  if (!file) return Service.ErrorResponse("File not found", 404);
  return Service.SuccessResponse({ file: FileMapper.toFileDTO(file) });
  } catch (err) {
    Logger.error(`FileService.getById : ${err}`);
    return Service.INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function listRecords(
  fileId: number,
  filter: FilteringQueryV2 | undefined
): Promise<Service.ServiceResponse<CallCenterTypes.CallCenterListResponseDTO>> {
  /** List call-center records for a file with access control (cached by file+filter) */
  try {

    const fileRepo = FileRepo.getFileRepo();
    const file = await fileRepo.getFileById(fileId);
    if (!file) return Service.ErrorResponse("File not found", 404);

    const limit =
      Number.isFinite(filter?.rows) && (filter?.rows as number) > 0 ? (filter?.rows as number) : 10;
    const effectiveFilter: FilteringQueryV2 = {
      ...filter,
      orderKey: filter?.orderKey ?? "id"
    };

    const query = cursorFilterBuilder(effectiveFilter, RECORD_SEARCH_FIELDS)
      .all()
      .cursor()
      .build();

    const records = await CallCenterRepo.getCallCenterRepo().listByFile(fileId, query);
    const hasNext = records.length > limit;
    const data = hasNext ? records.slice(0, limit) : records;
    const mapped = data.map(CallCenterMapper.toCallCenterDTO);
    const nextCursor = hasNext
      ? {
          createdAt: data.at(-1)!.createdAt.toISOString(),
          id: data.at(-1)!.id
        }
      : null;
    const prevCursor =
      data.length > 0
        ? { createdAt: data[0].createdAt.toISOString(), id: data[0].id }
        : null;
    const response = { records: mapped, nextCursor, prevCursor };

    return Service.SuccessResponse(response as CallCenterTypes.CallCenterListResponseDTO);
  } catch (err) {
    Logger.error(`FileService.listRecords : ${err}`);
    return Service.INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function summary(
  fileId: number
): Promise<Service.ServiceResponse<FileTypes.FileSummaryResponseDTO>> {
  /** Return summary stats for a file (cached) */
  try {
    const cacheKey = `file:summary:${fileId}`;
    const cached = await cacheGet<FileTypes.FileSummaryResponseDTO>(cacheKey);
    if (cached) {
      return Service.SuccessResponse(cached);
    }

    const fileRepo = FileRepo.getFileRepo();
    const file = await fileRepo.getFileById(fileId);
    if (!file) return Service.ErrorResponse("File not found", 404);

    const repo = CallCenterRepo.getCallCenterRepo();
    const totalRecords = await repo.countByFile(fileId);
    const avgCsatScore = await repo.avgCsatByFile(fileId);
    const bySentiment = await repo.countBySentiment(fileId);

    const response = {
      summary: {
        fileId,
        totalRecords,
        avgCsatScore,
        bySentiment
      }
    };

    await cacheSet(cacheKey, response, 60);
    return Service.SuccessResponse(response);
  } catch (err) {
    Logger.error(`FileService.summary : ${err}`);
    return Service.INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function create(
  payload: FileTypes.CreateFileRequestDTO,
  userId: number
): Promise<Service.ServiceResponse<FileTypes.CreateFileResponseDTO>> {
  /** Create file upload record and enqueue processing job */
  try {
    const fileName = payload.fileUrl.split("/").pop() || payload.fileUrl;
    const file = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const repo = FileRepo.getFileRepo(tx);
      return repo.createFile({
        fileUrl: payload.fileUrl,
        fileName,
        status: FILE_STATUS.PENDING,
        uploadedById: userId
      });
    });

    void queueCallCenterJob({ fileId: file.id, fileUrl: file.fileUrl }).catch((err) => {
      Logger.error(`FileService.create : enqueue failed : ${err}`);
    });

    return Service.SuccessResponse({ file: FileMapper.toFileDTO(file) });
  } catch (err) {
    Logger.error(`FileService.create : ${err}`);
    return Service.INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function retry(
  fileId: number
): Promise<Service.ServiceResponse<FileTypes.RetryFileResponseDTO>> {
  /** Retry processing for a failed file */
  try {
    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const repo = FileRepo.getFileRepo(tx);
      const existing = await repo.getFileById(fileId);
      if (!existing) return null;
      if (existing.status !== FILE_STATUS.FAILED) return FILE_STATUS.NOT_FAILED;

      return repo.updateFile(fileId, {
        status: FILE_STATUS.IN_PROGRESS,
        errorMessage: null
      });
    });

    if (updated === null) return Service.ErrorResponse("File not found", 404);
    if (updated === FILE_STATUS.NOT_FAILED) return Service.ErrorResponse("File is not failed", 409);

    void queueCallCenterJob({ fileId: updated.id, fileUrl: updated.fileUrl }).catch((err) => {
      Logger.error(`FileService.retry : enqueue failed : ${err}`);
    });

    return Service.SuccessResponse({ file: FileMapper.toFileDTO(updated) });
  } catch (err) {
    Logger.error(`FileService.retry : ${err}`);
    return Service.INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}
