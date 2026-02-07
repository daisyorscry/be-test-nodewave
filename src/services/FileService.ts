import * as Service from "$entities/Service";
import type * as FileTypes from "$entities/file";
import * as FileRepo from "$repositories/FileRepository";
import * as FileMapper from "$mappers/FileMapper";
import { buildFilterQueryLimitOffsetV2 } from "$services/helpers/FilterQueryV2";
import type { FilteringQueryV2 } from "$entities/Query";
import { queueCallCenterJob } from "$queues/callCenterQueue";
import * as CallCenterRepo from "$repositories/CallCenterRepository";
import * as CallCenterMapper from "$mappers/CallCenterMapper";
import type * as CallCenterTypes from "$entities/callcenter";
import { cacheDelByPattern, cacheGet, cacheSet } from "$utils/cache.utils";
import Logger from "$pkg/logger";
import { prisma } from "$utils/prisma.utils";
import type { Prisma } from "@prisma/client";
import { FILE_STATUS } from "$constants/fileStatus";

export async function list(
  filter?: FilteringQueryV2
): Promise<Service.ServiceResponse<FileTypes.FileListResponseDTO>> {
  try {
    const normalizedFilter = filter ?? {};
    const cacheKey = `files:list:${JSON.stringify(normalizedFilter)}`;

    const cached = await cacheGet<{ data: FileTypes.FileListResponseDTO; pagination: Service.PaginationMeta }>(
      cacheKey
    );
    if (cached) return Service.SuccessResponse(cached.data, cached.pagination);

    const repo = FileRepo.getFileRepo();
    const query = buildFilterQueryLimitOffsetV2(normalizedFilter);
    const [rowsData, totalRows] = await Promise.all([
      repo.listFiles(query),
      repo.countFiles(query.where)
    ]);

    const response = { files: rowsData.map(FileMapper.toFileDTO) };
    const page = normalizedFilter.page ?? 1;
    const rows = normalizedFilter.rows ?? 10;
    const totalPages = totalRows ? Math.max(1, Math.ceil(totalRows / rows)) : 0;
    const pagination = { page, rows, totalRows, totalPages };

    await cacheSet(cacheKey, { data: response, pagination }, 60);

    return Service.SuccessResponse(response, pagination);
  } catch (err) {
    Logger.error(`FileService.list : ${err}`);
    return Service.INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}



export async function getById(
  fileId: number,
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
    const cacheKey = `file:records:${fileId}:${JSON.stringify(filter ?? {})}`;
    const cached = await cacheGet<{
      data: CallCenterTypes.CallCenterListResponseDTO;
      pagination: Service.PaginationMeta;
    }>(cacheKey);
    if (cached) return Service.SuccessResponse(cached.data, cached.pagination);

    const fileRepo = FileRepo.getFileRepo();
    const file = await fileRepo.getFileById(fileId);
    if (!file) return Service.ErrorResponse("File not found", 404);

    const effectiveFilter: FilteringQueryV2 = {
      ...filter,
      orderKey: filter?.orderKey ?? "id"
    };

    const query = buildFilterQueryLimitOffsetV2(effectiveFilter);
    const repo = CallCenterRepo.getCallCenterRepo();
    const [records, totalRows] = await Promise.all([
      repo.listByFile(fileId, query),
      repo.countByFileWhere(fileId, query.where)
    ]);
    const response = {
      records: records.map(CallCenterMapper.toCallCenterDTO)
    };

    const page = filter?.page ?? 1;
    const rows = filter?.rows ?? 10;
    const totalPages = totalRows ? Math.max(1, Math.ceil(totalRows / rows)) : 0;
    const pagination = { page, rows, totalRows, totalPages };

    await cacheSet(cacheKey, { data: response, pagination }, 60);
    return Service.SuccessResponse(response as CallCenterTypes.CallCenterListResponseDTO, pagination);
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
    await cacheDelByPattern("files:list:*");

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
    await cacheDelByPattern("files:list:*");

    return Service.SuccessResponse({ file: FileMapper.toFileDTO(updated) });
  } catch (err) {
    Logger.error(`FileService.retry : ${err}`);
    return Service.INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}
