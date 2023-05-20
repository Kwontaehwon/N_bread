import { Request, Response, NextFunction } from 'express';
import { Result, ValidationError, validationResult } from 'express-validator';
import { statusCode, responseMessage } from '../constants';
import { fail } from '../util';

const errorValidator = (req: Request, res: Response, next: NextFunction) => {
  const errors: Result<ValidationError> = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, statusCode.BAD_REQUEST, responseMessage.ERROR_VALIDATOR_ERROR);
  }
  next();
};

export { errorValidator };
