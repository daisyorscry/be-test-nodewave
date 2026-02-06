import { ServiceResponse } from "$entities/Service";
import type { Response } from "express";

/**
 * Base of response handler
 * Note: `should not be used in controller`
 * @param res     - response object passed by express
 * @param status  - status code of a response
 * @param content - the response data
 * @param message - description of a response
 * @param errors  - list of errors if any
 * @returns response
 */
export const response_handler = (
  res: Response,
  status: number,
  content: unknown = null,
  message = "",
  errors: Array<string> = []
): Response => {
  return res.status(status).json({ content, message, errors });
};

/**
 * Bad Request :
 * The server could not understand the request due to invalid syntax
 * @param res response object
 * @param message description
 * @param errors list of errors
 */
export const response_bad_request = (
  res: Response,
  message = "Bad Request",
  errors: Array<any> = []
): Response => {
  return response_handler(res, 400, undefined, message, errors);
};

/**
 * Unauthorized :
 * The client must authenticate itself to get the requested response
 * @param res response object
 * @param message description
 * @param errors list of errors
 */
export const response_unauthorized = (
  res: Response,
  message = "Unauthorized",
  errors: Array<string> = []
): Response => {
  return response_handler(res, 401, undefined, message, errors);
};

/**
 * Forbidden :
 * The client does not have access rights to the content
 * @param res response object
 * @param message description
 * @param errors list of errors
 */
export const response_forbidden = (
  res: Response,
  message = "Forbidden",
  errors: Array<string> = []
): Response => {
  return response_handler(res, 403, undefined, message, errors);
};

/**
 * Not Found
 * The server can not find the requested resource
 * @param res response object
 * @param message description
 * @param errors list of errors
 */
export const response_not_found = (
  res: Response,
  message = "Not Found",
  errors: Array<string> = []
): Response => {
  return response_handler(res, 404, undefined, message, errors);
};

/**
 * Conflict
 * This response is sent when a request conflicts with the current state of the server
 * @param res response object
 * @param message description
 * @param errors list of errors
 */
export const response_conflict = (
  res: Response,
  message = "Conflict",
  errors: Array<string> = []
): Response => {
  return response_handler(res, 409, undefined, message, errors);
};

/**
 * Unprocessable Entity
 * The request was well-formed but was unable to be followed due to semantic errors
 * @param res response object
 * @param message description
 * @param errors list of errors
 */
export const response_unprocessable_entity = (
  res: Response,
  message = "Unprocessable Entity",
  errors: Array<string> = []
): Response => {
  return response_handler(res, 422, undefined, message, errors);
};

/**
 * Internal Server Error
 * The server encountered an unexpected condition that prevented it from fulfilling the request
 * @param res response object
 * @param message description
 * @param errors list of errors
 */
export const response_internal_server_error = (
  res: Response,
  message = "Internal Server Error",
  errors: Array<string> = []
): Response => {
  return response_handler(res, 500, undefined, message, errors);
};

/**
 * Ok
 * The request has succeeded
 * @param res response object
 * @param content response data
 * @param message description
 */
export const response_success = (
  res: Response,
  content: unknown = null,
  message = "Success"
): Response => {
  return response_handler(res, 200, content, message, undefined);
};

/**
 * Created
 * The request has succeeded and a new resource has been created as a result
 * @param res response object
 * @param content response data
 * @param message description
 */
export const response_created = (
  res: Response,
  content: unknown = null,
  message = "Created"
): Response => {
  return response_handler(res, 201, content, message, undefined);
};

export const handleServiceErrorWithResponse = (
  res: Response,
  serviceResponse: ServiceResponse<any>
): Response => {
  switch (serviceResponse.err?.code) {
    case 400:
      return response_bad_request(res, serviceResponse.err?.message);
    case 404:
      return response_not_found(res, serviceResponse.err?.message);
    case 401:
      return response_unauthorized(res, serviceResponse.err?.message);
    case 409:
      return response_conflict(res, serviceResponse.err?.message);
    default:
      return response_internal_server_error(res, serviceResponse.err?.message);
  }
};
