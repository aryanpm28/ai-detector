// Domain-specific error classes so the global handler can respond
// with the right status code and a clean, consistent message instead
// of leaking raw error internals to the client.

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Invalid request data') {
    super(message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Invalid credentials') {
    super(message, 401);
  }
}

class DuplicateEmailError extends AppError {
  constructor(message = 'Email already registered') {
    super(message, 409);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class EmptyTextError extends AppError {
  constructor(message = 'No text provided to analyze') {
    super(message, 400);
  }
}

class AIProviderError extends AppError {
  constructor(message = 'AI provider request failed') {
    super(message, 502); // Bad Gateway — upstream service failed
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  DuplicateEmailError,
  NotFoundError,
  EmptyTextError,
  AIProviderError,
};
