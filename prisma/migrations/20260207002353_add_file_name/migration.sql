/*
  Warnings:

  - A unique constraint covering the columns `[createdAt,id]` on the table `CallCenterRecord` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[createdAt,id]` on the table `FileUpload` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `FileUpload` ADD COLUMN `fileName` VARCHAR(191) NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX `CallCenterRecord_createdAt_id_idx` ON `CallCenterRecord`(`createdAt`, `id`);

-- CreateIndex
CREATE UNIQUE INDEX `CallCenterRecord_createdAt_id_key` ON `CallCenterRecord`(`createdAt`, `id`);

-- CreateIndex
CREATE INDEX `FileUpload_createdAt_id_idx` ON `FileUpload`(`createdAt`, `id`);

-- CreateIndex
CREATE UNIQUE INDEX `FileUpload_createdAt_id_key` ON `FileUpload`(`createdAt`, `id`);
