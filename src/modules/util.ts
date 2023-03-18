const jsonResponse = (res, code, message, isSuccess, result) => {
  res.status(code).json({
    code: code,
    message: message,
    isSuccess: isSuccess,
    result: result,
  });
};

export { jsonResponse };
