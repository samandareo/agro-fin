import i18n from '../i18n';

/**
 * Error Handler Utility
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
 * @param {Function} t - Translation function from i18next (optional)
 * @param {String} defaultMessage - Fallback message if no match found
 * @returns {String|SilentError} User-friendly error message or SilentError for 403
 */
export const getErrorMessage = (error, t = null, defaultMessage = 'errors.general') => {
  // If no translation function provided, use the imported i18n instance
  if (!t) {
    t = (key, fallback = key) => {
      try {
        return i18n.t(key, { defaultValue: fallback });
      } catch (e) {
        console.warn('Translation failed for key:', key, e);
        return fallback;
      }
    };
  }

  // If error has response from server
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // Handle 403 Forbidden - Don't show to users, return silent error
    if (status === 403) {
      const silentError = new SilentError('Forbidden');
      silentError.response = error.response;
      return silentError;
    }

    // Handle 401 Unauthorized
    if (status === 401) {
      return t('errors.unauthorized');
    }

    // Handle 404 Not Found
    if (status === 404) {
      return t('errors.notFound');
    }

    // Handle 409 Conflict
    if (status === 409) {
      return t('errors.conflict');
    }

    // Handle 400 Bad Request
    if (status === 400) {
      // Check if API provided a specific error code
      if (data?.message && typeof data.message === 'string') {
        const errorCode = data.message;
        
        // Map backend error codes to translation keys
        const errorKeyMap = {
          'USERNAME_ALREADY_EXISTS': 'errors.usernameAlreadyExists',
          'USER_NAME_ALREADY_EXISTS': 'errors.userNameAlreadyExists',
          'GROUP_NAME_ALREADY_EXISTS': 'errors.groupNameAlreadyExists',
          'DUPLICATE_ENTRY': 'errors.duplicateEntry',
          'RELATED_RECORD_NOT_FOUND': 'errors.relatedRecordNotFound',
          'REQUIRED_FIELD_MISSING': 'errors.requiredFieldMissing',
          'DATA_VALIDATION_FAILED': 'errors.dataValidationFailed',
          'REQUIRED_FIELDS_MISSING': 'errors.requiredFieldsMissing',
          'ROLE_REQUIRED': 'errors.roleRequired',
          'USER_CREATION_FAILED': 'errors.userCreationFailed',
          'FILE_ID_REQUIRED': 'errors.fileIdRequired',
          'FILE_NOT_FOUND': 'errors.fileNotFound',
          'FILE_ACCESS_DENIED': 'errors.fileAccessDenied',
          'TASK_ACCESS_DENIED': 'errors.taskAccessDenied',
          'FILE_DELETION_FAILED': 'errors.fileDeletionFailed',
        };
        
        const translationKey = errorKeyMap[errorCode];
        if (translationKey) {
          return t(translationKey);
        }
        
        // If no mapping found, use the error code as fallback
        return t(errorCode, errorCode);
      }
      return t('errors.badRequest');
    }

    // Handle 422 Unprocessable Entity (Validation errors)
    if (status === 422) {
      if (data?.message && typeof data.message === 'string') {
        const errorCode = data.message;
        return t(errorCode, errorCode);
      }
      return t('errors.validationError');
    }

    // Handle 500 Server Error
    if (status === 500) {
      return t('errors.serverError');
    }

    // Handle other 5xx Server Errors
    if (status >= 500) {
      return t('errors.serverError');
    }

    // If server provided a custom message, try to translate it
    if (data?.message && typeof data.message === 'string' && status < 500) {
      return t(data.message, data.message);
    }
  }

  // If no network response (network error)
  if (error.request && !error.response) {
    return t('errors.networkError');
  }

  // If error is in request setup
  if (error.message) {
    if (error.message.includes('timeout')) {
      return t('errors.timeout');
    }
    return t(defaultMessage);
  }

  return t(defaultMessage);
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

const errorHandler = {
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

export default errorHandler;
