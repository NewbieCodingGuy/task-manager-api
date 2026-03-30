const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  console.error(
    `[${new Date().toISOString()}] ${req.method} ${req.path} → ${statusCode}: ${message}`,
  );

  return res.status(statusCode).json({
    error: message,
  });
};

module.exports = errorHandler;
