const { json } = require("stream/consumers");

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
