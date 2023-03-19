const { ErrorWithStatusCode } = require('./errorGenerator');
const { fail } = require('../util');
const errorHandler = (error, req, res, next): Response => {
  const { message, statusCode } = error;
  return res.status(statusCode).send(fail(statusCode, message));
};
export { errorHandler };
