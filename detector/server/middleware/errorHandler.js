// Centralized error handler — every route forwards errors here via next(err)
// instead of each route building its own try/catch + status code by hand.
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  // Only log full stack traces for genuine server errors, not expected
  // "operational" errors like bad credentials or validation failures.
  if (!err.isOperational) {
    console.error('Unexpected error:', err);
  }

  res.status(statusCode).json({
    message: err.isOperational ? err.message : 'Something went wrong. Please try again later.',
  });
}

// Wraps an async route handler so thrown errors / rejected promises
// are forwarded to errorHandler automatically, instead of needing a
// try/catch in every single route.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };
