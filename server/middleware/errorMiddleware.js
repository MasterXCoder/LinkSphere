const ApiError = require("../utils/ApiError");

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const isDuplicateKey = error.code === 11000;
    const duplicateField = isDuplicateKey && Object.keys(error.keyPattern || error.keyValue || {})[0];
    const statusCode = isDuplicateKey ? 400 : error.statusCode || 500;
    const message = isDuplicateKey
      ? `${duplicateField || "Value"} already exists`
      : error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  
  if (process.env.NODE_ENV === "production" && !err.isOperational) {
    statusCode = 500;
    message = "Internal Server Error";
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }

  res.status(statusCode).send(response);
};

module.exports = {
  errorConverter,
  errorHandler,
};
