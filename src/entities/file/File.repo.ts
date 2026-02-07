export type FileUploadWithUser = {
  id: number;
  fileUrl: string;
  fileName: string;
  status: string;
  errorMessage: string | null;
  totalRows: number | null;
  processedRows: number | null;
  uploadedById: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateFileData = {
  fileUrl: string;
  fileName: string;
  status: import("@prisma/client").ProcessingStatus;
  uploadedById: number;
};
