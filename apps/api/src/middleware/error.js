// apps/api/src/middleware/error.js
const { NODE_ENV } = require('../config/env');

function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}`, err.message);

  const status  = err.status || err.statusCode || 500;
  const message = NODE_ENV === 'production' ? 'Internal server error' : err.message;

  res.status(status).json({
    error: message,
    ...(NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = errorHandler;