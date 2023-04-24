import { logger } from '../config/winston';
const jwt = require('jsonwebtoken');
import { Request, Response, NextFunction } from 'express';
import config from '../config';
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

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    req.decoded = jwt.verify(req.headers.authorization, config.jwtSecret);
    return next();
  } catch (error) {
    logger.error(error);
    if (error.name === `TokenExpiredError`) {
      logger.info('토큰이 만료되었습니다.');
      // const expiredToken = jwt.verify(req.headers.authorization, config.jwtSecret, {ignoreExpiration : true});
      // console.log(expiredToken);
      return jsonResponse(res, 419, `토큰이 만료됬습니다.`, false);
    }
    logger.info('유효하지 않은 토큰 입니다.');
    return jsonResponse(res, 401, `유효하지 않은 토큰입니다.`, false);
  }
};
export { isLoggedIn, isNotLoggedIn, verifyToken };
