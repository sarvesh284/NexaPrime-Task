import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message: string = 'Operation completed successfully',
  statusCode: number = 200,
  pagination?: ApiResponse['pagination']
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
    ...(pagination ? { pagination } : {}),
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400,
  errorCode: string = 'BAD_REQUEST',
  details?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error: {
      code: errorCode,
      ...(details ? { details } : {}),
    },
  };
  return res.status(statusCode).json(response);
};
