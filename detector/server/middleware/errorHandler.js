// Centralized error handler
function errorHandler(err, req, res, next) {

  // Invalid MongoDB ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format',
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors || {})
      .map((error) => error.message)
      .join(', ') || 'Validation failed';

    return res.status(400).json({
      message,
    });
  }

  // Duplicate MongoDB key
  if (err.code === 11000) {
    return res.status(409).json({
      message: 'Email already registered',
    });
  }

  const statusCode = err.statusCode || 500;

  // Only log unexpected server errors
  if (!err.isOperational) {
    console.error('Unexpected error:', err);
  }

  res.status(statusCode).json({
    message: err.isOperational
      ? err.message
      : 'Something went wrong. Please try again later.',
  });
}

// Wrap async route handlers
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };
