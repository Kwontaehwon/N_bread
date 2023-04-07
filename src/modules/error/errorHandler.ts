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
  if (error.statusCode == undefined) error.statusCode = 500; // customError를 발생시킨 것이 아닐 경우
  const { message, statusCode } = error;
  return res.status(statusCode).json(fail(statusCode, message));
};
export { errorHandler };
