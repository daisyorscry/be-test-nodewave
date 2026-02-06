import { Queue, Worker } from "bullmq";
import type { Job } from "bullmq";
import { redis } from "$pkg/redis";
import { prisma } from "$utils/prisma.utils";
import { cacheDel, cacheDelByPattern } from "$utils/cache.utils";
import { FILE_STATUS } from "$constants/fileStatus";
import { extractSheetRows, loadExcelBuffer, parseWorkbook } from "$utils/excel.utils";
import { mapRowsToRecords, updateProgress } from "$utils/callCenter.utils";

type CallCenterJobData = {
  fileId: number;
  fileUrl: string;
};

export const callCenterQueue = new Queue<CallCenterJobData>("call-center", {
  connection: redis
});

// Enqueue a background job that downloads and processes the Excel file.
export async function queueCallCenterJob(data: CallCenterJobData) {
  await callCenterQueue.add("process", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 }
  });
}

// Worker that parses the Excel file and persists records into the database.
export function startCallCenterWorker() {
  // start worker once
  const worker = new Worker<CallCenterJobData>(
    "call-center",
    async (job: Job<CallCenterJobData>) => {
      const { fileId, fileUrl } = job.data;

      try {
        // 1) Load and parse Excel.
        const buffer = await loadExcelBuffer(fileUrl);
        const workbook = parseWorkbook(buffer);
        const rows = extractSheetRows(workbook);
        const headerRowIndex = 4;
        const headers = rows[headerRowIndex] as string[];
        const dataRows = rows.slice(headerRowIndex + 1);

        const totalRows = dataRows.length;
        const batchSize = 500;
        let processedRows = 0;

        // 2) Mark file as in progress and initialize counters.
        await (prisma as any).fileUpload.update({
          where: { id: fileId },
          data: { status: FILE_STATUS.IN_PROGRESS, errorMessage: null, totalRows, processedRows: 0 }
        });

        // 3) Insert records in batches and update progress.
        for (let i = 0; i < dataRows.length; i += batchSize) {
          const batch = dataRows.slice(i, i + batchSize);
          const mapped = mapRowsToRecords(fileId, headers, batch, i);
          if (mapped.length === 0) continue;
          await (prisma as any).callCenterRecord.createMany({ data: mapped });
          processedRows += mapped.length;
          await updateProgress(fileId, processedRows);
        }

        // 4) Mark success and invalidate caches.
        await (prisma as any).fileUpload.update({
          where: { id: fileId },
          data: {
            status: FILE_STATUS.SUCCESS,
            totalRows,
            processedRows
          }
        });
        await cacheDel(`file:summary:${fileId}`);
        await cacheDelByPattern(`file:records:${fileId}:*`);
      } catch (err: any) {
        // Mark failure and invalidate caches so clients see latest status.
        await (prisma as any).fileUpload.update({
          where: { id: fileId },
          data: {
            status: FILE_STATUS.FAILED,
            errorMessage: err?.message || "Processing failed"
          }
        });
        await cacheDel(`file:summary:${fileId}`);
        await cacheDelByPattern(`file:records:${fileId}:*`);
        throw err;
      }
    },
    { connection: redis }
  );

  return worker;
}
