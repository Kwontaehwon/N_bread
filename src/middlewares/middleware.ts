import { Request, Response, NextFunction } from 'express';
import statusCode from '../modules/constants/statusCode';
import responseMessage from '../modules/constants/responseMessage';
import { fail } from '../modules/util';
import { jwtHandler } from '../modules';
import { JwtPayload } from 'jsonwebtoken';
function jsonResponse(res, code, message, isSuccess) {
  res.status(code).json({
    code: code,
    message: message,
    isSuccess: isSuccess,
  });
}

const isLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    fail(res, statusCode.UNAUTHORIZED, responseMessage.UNAUTHORIZED);
  }
};

const isNotLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    next();
  } else {
    fail(res, statusCode.FORBIDDEN, responseMessage.FORBIDDEN);
  }
};

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
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
    req.query.id = userId;
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

export { isLoggedIn, isNotLoggedIn, verifyToken };
