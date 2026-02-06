/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `password` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `CallCenterRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fileId` INTEGER NOT NULL,
    `rowNumber` INTEGER NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `sentiment` VARCHAR(191) NOT NULL,
    `csatScore` INTEGER NULL,
    `callTimestamp` DATETIME(3) NULL,
    `reason` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `channel` VARCHAR(191) NULL,
    `responseTime` VARCHAR(191) NULL,
    `callDurationMinutes` INTEGER NULL,
    `callCenter` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CallCenterRecord_fileId_idx`(`fileId`),
    INDEX `CallCenterRecord_sentiment_idx`(`sentiment`),
    INDEX `CallCenterRecord_callTimestamp_idx`(`callTimestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FileUpload` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fileUrl` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `errorMessage` VARCHAR(191) NULL,
    `totalRows` INTEGER NULL,
    `processedRows` INTEGER NULL,
    `uploadedById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CallCenterRecord` ADD CONSTRAINT `CallCenterRecord_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `FileUpload`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileUpload` ADD CONSTRAINT `FileUpload_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
