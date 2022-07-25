const logger = require('../config/winston');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

function jsonResponse(res, code, message, isSuccess) {
  res.status(code).json({
    code: code,
    message: message,
    isSuccess: isSuccess,
  })
}

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    console.log('로그인 된 상태입니다.')
    next();
  } else {
    jsonResponse(res,401,'로그인이 필요한 서비스입니다.',false)
  }
};

exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    next();
  } else {
    jsonResponse(res,401,'로그인 한 상태입니다.',false)
  }
};

exports.verifyToken = (req, res, next) => {
  try{
    req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
    return next();
  } catch (error){
    logger.error(error);
    if(error.name === `TokenExpiredError`) {
      logger.info('토큰이 만료되었습니다.');
      // const expiredToken = jwt.verify(req.headers.authorization, process.env.JWT_SECRET, {ignoreExpiration : true});
      // console.log(expiredToken);
      return jsonResponse(res, 419, `토큰이 만료됬습니다.`, false , null); 
    }
    logger.info('유효하지 않은 토큰 입니다.');
    return jsonResponse(res, 401, `유효하지 않은 토큰입니다.`, false, null);
  }
}