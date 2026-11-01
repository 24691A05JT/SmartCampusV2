import { sendError } from '../utils/apiResponse.js';

/**
 * Central Error Handling Middleware
 * Gracefully formats all errors, avoids leaking sensitive stack traces in production,
 * and handles specific Mongoose and JWT errors.
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    message = `Resource not found with id of ${err.value}`;
    statusCode = 404;
  }

  // Mongoose Duplicate Key Error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}. Please use another value.`;
    statusCode = 400;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    message = 'Validation Error';
    statusCode = 400;
    errors = Object.values(err.errors).map((val) => val.message);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token. Please log in again.';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Authentication token expired. Please log in again.';
    statusCode = 401;
  }

  // Log server errors for debugging (in dev/test)
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error('[SERVER ERROR]:', err);
  }

  return sendError(res, message, statusCode, errors);
};

export const notFoundHandler = (req, res, next) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};
