import { ErrorWithStatusCode } from './errorGenerator';
import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { fail } from '../util';
import { logger } from '../../config/winston';

const errorHandler: ErrorRequestHandler = (
  error: ErrorWithStatusCode,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error.statusCode == undefined) error.statusCode = 500; // customError를 발생시킨 것이 아닐 경우
  if ((error.name = 'NotFoundError')) error.statusCode = 404;
  const { message, statusCode } = error;
  logger.error(error);
  return fail(res, statusCode, message);
};
export { errorHandler };
