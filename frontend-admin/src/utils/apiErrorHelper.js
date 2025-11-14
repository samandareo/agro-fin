import { isSilentError } from './errorHandler';
import toast from 'react-hot-toast';
import i18n from '../i18n';

/**
 * Translate error code to user-friendly message
 * @param {String} errorCode - Error code from backend
 * @returns {String} Translated error message
 */
const translateErrorCode = (errorCode) => {
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
    'UNAUTHORIZED': 'errors.unauthorized',
    'NOT_FOUND': 'errors.notFound',
    'CONFLICT': 'errors.conflict',
    'SERVER_ERROR': 'errors.serverError',
    'NETWORK_ERROR': 'errors.networkError',
    'TIMEOUT': 'errors.timeout',
    'GENERAL_ERROR': 'errors.general'
  };
  
  const translationKey = errorKeyMap[errorCode] || 'errors.general';
  
  try {
    return i18n.t(translationKey);
  } catch (e) {
    console.warn('Translation failed for error code:', errorCode, e);
    return errorCode.replace(/_/g, ' ').toLowerCase();
  }
};

/**
 * Safely handle API errors in contexts
 * Shows toast only if error is not silent (403)
 * 
 * @param {Error} error - The error object from API call
 * @param {String} defaultMessage - Default message if error has no message
 * @param {Boolean} showToast - Whether to show toast (default: true)
 */
export const handleContextError = (error, defaultMessage = 'An error occurred', showToast = true) => {
  // Check if this is a silent error (403 Forbidden) - don't show anything
  if (isSilentError(error)) {
    console.log('[SILENT_ERROR] 403 Forbidden - not showing to user');
    return;
  }

  // Get error message - translate if it's an error code
  let errorMessage = defaultMessage;
  
  if (error?.errorCode) {
    // This is an error code from our API interceptor - translate it
    errorMessage = translateErrorCode(error.errorCode);
  } else if (error?.message) {
    // Check if the message is an error code
    if (error.message.includes('_') && error.message === error.message.toUpperCase()) {
      errorMessage = translateErrorCode(error.message);
    } else {
      errorMessage = error.message;
    }
  } else if (error?.response?.data?.message) {
    errorMessage = error.response.data.message;
  }

  // Show toast if requested
  if (showToast) {
    toast.error(errorMessage);
  }

  return errorMessage;
};

/**
 * Safely handle API errors but return the error for manual handling
 * 
 * @param {Error} error - The error object from API call
 * @param {String} context - Context name for logging
 * @returns {Object} Object with isSilent flag and message
 */
export const parseError = (error, context = '') => {
  if (isSilentError(error)) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${context}] SILENT_ERROR - 403 Forbidden`);
    }
    return {
      isSilent: true,
      message: null,
    };
  }

  const message = error?.message || error?.response?.data?.message || 'An error occurred';
  return {
    isSilent: false,
    message,
  };
};

const apiErrorHelper = {
  handleContextError,
  parseError,
};

export default apiErrorHelper;
