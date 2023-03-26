const { ErrorWithStatusCode } = require('./errorGenerator');
import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { ErrorWithStatusCode } from './errorGenerator';
const express = require('express');
const { fail } = require('../util');
const errorHandler: ErrorRequestHandler = (
  error: ErrorWithStatusCode,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { message, statusCode } = error;
  console.log(error);
  return res.status(statusCode).json(fail(statusCode, message));
};
export { errorHandler };
