import { isSilentError } from './errorHandler';
import toast from 'react-hot-toast';

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

  // Get error message
  const errorMessage = error?.message || error?.response?.data?.message || defaultMessage;

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

export default {
  handleContextError,
  parseError,
};
