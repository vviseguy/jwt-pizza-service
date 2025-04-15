const logger = require("./logger")

class StatusCodeError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch((error) => {
    logger.logUnhandledError(error);
    console.log(error)
    next(error);
  });
};

module.exports = {
  asyncHandler,
  StatusCodeError,
};
