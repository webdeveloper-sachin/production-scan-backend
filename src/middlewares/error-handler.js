import { ApiError } from '../utils/api-error.js';
import { NODE_ENV } from '../config/env.js';

const PG_ERRORS = {
  23505: [409, 'Duplicate entry: record already exists'],
  23503: [400, 'Referenced record does not exist (or is still in use)'],
  23502: [400, 'A required field is missing'],
  23514: [400, 'A value violates a validation rule'],
  '22P02': [400, 'Invalid value format'],
  22001: [400, 'A value is too long for its field'],
  22003: [400, 'A number is out of range'],
};

export const errorHandler = (err, _req, res, _next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors = [];

  if (err instanceof ApiError) {
    ({ statusCode, message, errors } = err);
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON body';
  } else if (PG_ERRORS[err.code]) {
    [statusCode, message] = PG_ERRORS[err.code];
    if (NODE_ENV !== 'production') errors = [err.detail || err.message];
  }

  if (statusCode >= 500) console.error(err);

  res.status(statusCode).json({
    statusCode,
    message,
    data: null,
    success: false,
    errors,
    ...(NODE_ENV !== 'production' && statusCode >= 500 && { stack: err.stack }),
  });
};
