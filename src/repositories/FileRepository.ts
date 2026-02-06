import { prisma } from "$utils/prisma.utils";
import type { DbClient } from "$entities/Db";
import type * as FileTypes from "$entities/file";
import type { Prisma } from "@prisma/client";

export function fileRepository(db: DbClient = prisma) {
  return {
    listFiles: async (query?: Prisma.FileUploadFindManyArgs): Promise<FileTypes.FileUploadWithUser[]> => {
      return db.fileUpload.findMany(query);
    },

    getFileById: async (id: number): Promise<FileTypes.FileUploadWithUser | null> => {
      return db.fileUpload.findUnique({
        where: { id }
      });
    },

    createFile: async (data: FileTypes.CreateFileData): Promise<FileTypes.FileUploadWithUser> => {
      return db.fileUpload.create({ data });
    },

    updateFile: async (id: number, data: Prisma.FileUploadUpdateInput): Promise<FileTypes.FileUploadWithUser> => {
      return db.fileUpload.update({ where: { id }, data });
    }
  };
}

export function getFileRepo(tx?: DbClient) {
  return fileRepository(tx ?? prisma);
}
