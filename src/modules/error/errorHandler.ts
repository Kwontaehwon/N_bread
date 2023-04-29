import { ErrorWithStatusCode } from './errorGenerator';
import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { fail } from '../util';

const errorHandler: ErrorRequestHandler = (
  error: ErrorWithStatusCode,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error.statusCode == undefined) error.statusCode = 500; // customError를 발생시킨 것이 아닐 경우
  const { message, statusCode } = error;
  console.log(error);
  return fail(res, statusCode, message);
};
export { errorHandler };
