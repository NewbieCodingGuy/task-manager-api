const logger = require("../config/logger.js");

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  logger.error({
    message,
    statusCode,
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
  });

  return res.status(statusCode).json({
    error: message,
  });
};

module.exports = errorHandler;
