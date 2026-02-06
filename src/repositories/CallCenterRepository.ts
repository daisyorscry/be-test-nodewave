import { prisma } from "$utils/prisma.utils";
import type { DbClient } from "$entities/Db";
import type { Prisma } from "@prisma/client";

export function callCenterRepository(db: DbClient = prisma) {
  return {
    listByFile: async (fileId: number, query?: Prisma.CallCenterRecordFindManyArgs) => {
      if (!query) {
        return db.callCenterRecord.findMany({ where: { fileId } });
      }
      return db.callCenterRecord.findMany({
        ...query,
        where: { ...query.where, fileId }
      });
    },

    countByFile: async (fileId: number): Promise<number> => {
      return db.callCenterRecord.count({
        where: { fileId }
      });
    },

    avgCsatByFile: async (fileId: number): Promise<number | null> => {
      const result = await db.callCenterRecord.aggregate({
        where: { fileId },
        _avg: { csatScore: true }
      });
      const avg = result?._avg?.csatScore;
      return typeof avg === "number" ? Number(avg.toFixed(2)) : null;
    },

    countBySentiment: async (fileId: number): Promise<Record<string, number>> => {
      const rows = await db.callCenterRecord.groupBy({
        by: ["sentiment"],
        where: { fileId },
        _count: { sentiment: true }
      });
      const result: Record<string, number> = {};
      rows.forEach((r) => {
        result[r.sentiment || "UNKNOWN"] = r._count?.sentiment ?? 0;
      });
      return result;
    }
  };
}

export function getCallCenterRepo(tx?: DbClient) {
  return callCenterRepository(tx ?? prisma);
}
