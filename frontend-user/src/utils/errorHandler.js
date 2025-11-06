/**
 * Error Handler Utility for Frontend User
 * Converts API errors into user-friendly messages
 * Hides sensitive error details from users
 * 403 errors are silently suppressed and not shown to users
 */

// Special error type for silent errors (403 Forbidden)
export class SilentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SilentError';
    this.isSilent = true;
  }
}

/**
 * Get user-friendly error message based on error code and status
 * @param {Object} error - Axios error object
 * @param {String} defaultMessage - Fallback message if no match found
 * @returns {String|SilentError} User-friendly error message or SilentError for 403
 */
export const getErrorMessage = (error, defaultMessage = 'An error occurred. Please try again.') => {
  // If error has response from server
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // Handle 403 Forbidden - Don't show to users, return silent error
    if (status === 403) {
      // Return a SilentError that won't be displayed to the user
      // but can be handled programmatically if needed
      const silentError = new SilentError('Forbidden');
      silentError.response = error.response;
      return silentError;
    }

    // Handle 401 Unauthorized
    if (status === 401) {
      return 'Your session has expired. Please log in again.';
    }

    // Handle 404 Not Found
    if (status === 404) {
      return 'The requested resource was not found.';
    }

    // Handle 409 Conflict
    if (status === 409) {
      return 'This resource already exists or there is a conflict with existing data.';
    }

    // Handle 400 Bad Request
    if (status === 400) {
      // Check if API provided a specific message
      if (data?.message && typeof data.message === 'string') {
        return data.message;
      }
      return 'Invalid input. Please check your data and try again.';
    }

    // Handle 422 Unprocessable Entity (Validation errors)
    if (status === 422) {
      if (data?.message && typeof data.message === 'string') {
        return data.message;
      }
      return 'Please check your input and try again.';
    }

    // Handle 500 Server Error
    if (status === 500) {
      return 'An error occurred on the server. Please try again later.';
    }

    // Handle other 5xx Server Errors
    if (status >= 500) {
      return 'A server error occurred. Please try again later.';
    }

    // If server provided a custom message, use it for non-sensitive errors
    if (data?.message && typeof data.message === 'string' && status < 500) {
      return data.message;
    }
  }

  // If no network response (network error)
  if (error.request && !error.response) {
    return 'Network error. Please check your connection and try again.';
  }

  // If error is in request setup
  if (error.message) {
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    // Don't expose raw error messages
    return defaultMessage;
  }

  return defaultMessage;
};

/**
 * Log error for debugging (development only)
 * @param {Object} error - Error object
 * @param {String} context - Context where error occurred
 */
export const logErrorForDebug = (error, context = '') => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}] Error:`, error);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
};

/**
 * Check if error is a silent error (should not be shown to user)
 * @param {Error} error - Error object
 * @returns {Boolean}
 */
export const isSilentError = (error) => {
  return error instanceof SilentError || error?.isSilent === true;
};

/**
 * Check if error is authorization/permission related
 * @param {Object} error - Axios error object
 * @returns {Boolean}
 */
export const isAuthorizationError = (error) => {
  return error.response?.status === 403 || error.response?.status === 401;
};

/**
 * Check if error is a validation error
 * @param {Object} error - Axios error object
 * @returns {Boolean}
 */
export const isValidationError = (error) => {
  return error.response?.status === 400 || error.response?.status === 422;
};

/**
 * Check if error is a not found error
 * @param {Object} error - Axios error object
 * @returns {Boolean}
 */
export const isNotFoundError = (error) => {
  return error.response?.status === 404;
};

/**
 * Check if error is a server error
 * @param {Object} error - Axios error object
 * @returns {Boolean}
 */
export const isServerError = (error) => {
  return error.response?.status >= 500;
};

/**
 * Check if error is a network error
 * @param {Object} error - Axios error object
 * @returns {Boolean}
 */
export const isNetworkError = (error) => {
  return error.request && !error.response;
};

export default {
  getErrorMessage,
  logErrorForDebug,
  isSilentError,
  isAuthorizationError,
  isValidationError,
  isNotFoundError,
  isServerError,
  isNetworkError,
  SilentError,
};
