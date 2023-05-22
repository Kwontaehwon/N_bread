import { Request, Response, NextFunction } from 'express';
import { Result, ValidationError, validationResult } from 'express-validator';
import { statusCode, responseMessage } from '../constants';
import { fail } from '../util';
import { logger } from '../../config/winston';

const errorValidator = (req: Request, res: Response, next: NextFunction) => {
  const errors: Result<ValidationError> = validationResult(req);
  if (!errors.isEmpty()) {
    logger.info(JSON.stringify(errors));

    const errorsArray = errors.array();
    let paramsString = '';

    errorsArray.forEach((error) => {
      paramsString += error.param + ', ';
    });

    return fail(
      res,
      statusCode.BAD_REQUEST,
      paramsString + responseMessage.ERROR_VALIDATOR_ERROR,
    );
  }
  next();
};

export { errorValidator };
