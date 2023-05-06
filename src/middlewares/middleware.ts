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
    console.log('로그인 된 상태입니다.');
    next();
  } else {
    jsonResponse(res, 401, '로그인이 필요한 서비스입니다.', false);
  }
};

const isNotLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    next();
  } else {
    jsonResponse(res, 401, '로그인 한 상태입니다.', false);
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
    console.log('userId입니다', userId);
    req.decoded = userId;
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
