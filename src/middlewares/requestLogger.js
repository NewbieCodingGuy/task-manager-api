const logger = require("../config/logger.js");

const requestLogger = (req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });
  next();
};

module.exports = requestLogger;
