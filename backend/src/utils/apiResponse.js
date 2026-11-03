/**
 * Standard API Response envelope helpers
 * Ensures consistent response formatting across all endpoints.
 */

export const sendSuccess = (res, message = 'Success', data = null, statusCode = 200, pagination = null, meta = null) => {
  const response = {
    success: true,
    message,
    data
  };

  if (pagination) {
    response.pagination = pagination;
  }

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
