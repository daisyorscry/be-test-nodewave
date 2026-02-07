export type FileUploadDTO = {
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

export type FileListResponseDTO = {
  files: FileUploadDTO[];
};
export type FileDetailResponseDTO = { file: FileUploadDTO };

export type CreateFileRequestDTO = {
  fileUrl: string;
};

export type CreateFileResponseDTO = { file: FileUploadDTO };
export type RetryFileResponseDTO = { file: FileUploadDTO };

export type FileSummaryDTO = {
  fileId: number;
  totalRecords: number;
  avgCsatScore: number | null;
  bySentiment: Record<string, number>;
};
export type FileSummaryResponseDTO = { summary: FileSummaryDTO };
