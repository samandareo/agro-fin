import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

/**
 * Custom hook for error message handling with i18n support
 * Properly handles translation in React components
 */
export const useErrorMessage = () => {
  const { t } = useTranslation();

  const getErrorMessage = useMemo(() => {
    return (error, defaultMessage = 'errors.general') => {
      // If error has response from server
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        // Handle 403 Forbidden - Don't show to users, return silent error
        if (status === 403) {
          const silentError = new Error('Forbidden');
          silentError.isSilent = true;
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
            
            // If no mapping found, check if translation exists for the error code directly
            const translated = t(`errors.${errorCode.toLowerCase().replace(/_/g, '')}`, '');
            if (translated) {
              return translated;
            }
            
            // Last fallback - return the human-readable version of the error code
            return errorCode.replace(/_/g, ' ').toLowerCase();
          }
          return t('errors.badRequest');
        }

        // Handle 422 Unprocessable Entity (Validation errors)
        if (status === 422) {
          if (data?.message && typeof data.message === 'string') {
            const errorCode = data.message;
            const translated = t(`errors.${errorCode.toLowerCase().replace(/_/g, '')}`, '');
            return translated || errorCode.replace(/_/g, ' ').toLowerCase();
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
          const translated = t(`errors.${data.message.toLowerCase().replace(/_/g, '')}`, '');
          return translated || data.message;
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
  }, [t]);

  return { getErrorMessage };
};

export default useErrorMessage;