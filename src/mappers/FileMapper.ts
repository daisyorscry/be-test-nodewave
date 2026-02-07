import type * as FileTypes from "$entities/file";

export function toFileDTO(file: FileTypes.FileUploadWithUser): FileTypes.FileUploadDTO {
  return {
    id: file.id,
    fileUrl: file.fileUrl,
    fileName: file.fileName,
    status: file.status,
    errorMessage: file.errorMessage,
    totalRows: file.totalRows,
    processedRows: file.processedRows,
    uploadedById: file.uploadedById,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt
  };
}
