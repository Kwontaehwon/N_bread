import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { jwtHandler } from '../modules';
import { responseMessage, statusCode } from '../modules/constants';
import { fail } from '../modules/util';

export default async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  if (!token) {
    return fail(res, statusCode.UNAUTHORIZED, responseMessage.UNAUTHORIZED);
  }

  try {
    const decoded = jwtHandler.verify(token);
    if (
      decoded === responseMessage.TOKEN_INVALID ||
      decoded === responseMessage.TOKEN_EXPIRED
    ) {
      return fail(res, statusCode.UNAUTHORIZED, decoded);
    }
    const userId = (decoded as JwtPayload).id;
    if (!userId) {
      return fail(res, statusCode.UNAUTHORIZED, responseMessage.UNAUTHORIZED);
    }
    req.decoded.id = userId;
    next();
  } catch (error) {
    console.log(error);
    return fail(
      res,
      statusCode.UNAUTHORIZED,
      responseMessage.INTERNAL_SERVER_ERROR,
    );
  }
};
