const jsonResponse = (res, code, message, isSuccess, result) => {
  res.status(code).json({
    code: code,
    message: message,
    isSuccess: isSuccess,
    result: result,
  });
};

const success = (code: number, message: string, result?: any) => {
  return {
    code,
    success: true,
    message,
    result,
  };
};

const fail = (code: number, message: string) => {
  return {
    code,
    success: false,
    message,
  };
};

export { jsonResponse, success, fail };
