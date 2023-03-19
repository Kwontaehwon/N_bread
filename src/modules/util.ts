const jsonResponse = (res, code, message, isSuccess, result) => {
  res.status(code).json({
    code: code,
    message: message,
    isSuccess: isSuccess,
    result: result,
  });
};

const success = (res, code, message, result) => {
  res.status(code).json({
    code: code,
    message: message,
    result: result,
  });
};

const fail = (res, code, message) => {
  res.status(code).json({
    code: code,
    message: message,
  });
};

export { jsonResponse, success, fail };
