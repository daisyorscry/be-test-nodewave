export interface ServiceResponse<T> {
  data?: T;
  pagination?: PaginationMeta;
  err?: ServiceError;
  status: boolean;
}

interface ServiceError {
  message: string;
  code: number;
}

export interface PaginationMeta {
  page: number;
  rows: number;
  totalRows: number | null;
  totalPages: number | null;
}

export const INTERNAL_SERVER_ERROR_SERVICE_RESPONSE: ServiceResponse<any> = {
  status: false,
  data: undefined,
  err: {
    message: "Internal Server Error",
    code: 500
  }
}

export const INVALID_ID_SERVICE_RESPONSE: ServiceResponse<any> = {
  status: false,
  data: undefined,
  err: {
    message: "Invalid ID, Data not Found",
    code: 404
  }
}

export function SuccessResponse<T>(data: T, pagination?: PaginationMeta): ServiceResponse<T> {
  return {
    status: true,
    data,
    pagination
  };
}

export function ErrorResponse(message: string, code: number): ServiceResponse<never> {
  return {
    status: false,
    err: {
      message,
      code
    }
  };
}

export function BadRequestWithMessage(message: string): ServiceResponse<any> {
  return {
    status: false,
    data: undefined,
    err: {
      message,
      code: 404
    }
  }
}
