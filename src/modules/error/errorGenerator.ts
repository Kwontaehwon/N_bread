const { responseMessage, statusCode } = require('../constants');

const HTTPS_ERROR: { [key: number]: string } = {
  400: responseMessage.BAD_REQUEST,
  401: responseMessage.UNAUTHORIZED,
  403: responseMessage.FORBIDDEN,
  404: responseMessage.NOT_FOUND,
  500: responseMessage.INTERNAL_SERVER_ERROR,
  503: responseMessage.SERVICE_NOT_AVAILABLE,
};

interface ErrorWithStatusCode extends Error {
  statusCode?: number;
}

//상태 코드 받아 HTTPS 에러와 매핑
const errorGenerator = ({
  code = 500,
  message = responseMessage.INTERNER_SERVER_ERROR,
}: {
  code?: number;
  message?: string;
}): void => {
  const err: ErrorWithStatusCode = new Error(message || HTTPS_ERROR[code]);
  err.statusCode = code;
  throw err;
};

export { errorGenerator, ErrorWithStatusCode };
