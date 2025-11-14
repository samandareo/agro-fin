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
 * @param {String} defaultMessage - Fallback message if no match found
 * @returns {String|SilentError} User-friendly error message or SilentError for 403
 */
/**
 * Parse multilingual error message based on current language
 * @param {String} message - Message in format "Russian | Uzbek"
 * @returns {String} Localized message
 */
const parseMultilingualMessage = (message) => {
  // Get current language from i18n or localStorage
  const currentLanguage = localStorage.getItem('i18nextLng') || 'ru';
  
  if (message.includes(' | ')) {
    const [russian, uzbek] = message.split(' | ');
    return currentLanguage === 'uz' ? uzbek : russian;
  }
  
  return message;
};

export const getErrorMessage = (error, defaultMessage = 'Произошла ошибка. Пожалуйста, попробуйте снова. | Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.') => {
  const currentLanguage = localStorage.getItem('i18nextLng') || 'ru';
  
  // Parse default message for current language
  const localizedDefaultMessage = parseMultilingualMessage(defaultMessage);
  
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
      return currentLanguage === 'uz' 
        ? 'Sizning sessiyangiz tugadi. Iltimos, qaytadan tizimga kiring.'
        : 'Ваша сессия истекла. Пожалуйста, войдите в систему снова.';
    }

    // Handle 404 Not Found
    if (status === 404) {
      return currentLanguage === 'uz'
        ? 'So\'ralgan resurs topilmadi.'
        : 'Запрашиваемый ресурс не найден.';
    }

    // Handle 409 Conflict
    if (status === 409) {
      return currentLanguage === 'uz'
        ? 'Ushbu resurs allaqachon mavjud yoki mavjud ma\'lumotlar bilan ziddiyat bor.'
        : 'Этот ресурс уже существует или есть конфликт с существующими данными.';
    }

    // Handle 400 Bad Request
    if (status === 400) {
      // Check if API provided a specific message
      if (data?.message && typeof data.message === 'string') {
        // Handle multilingual constraint error messages
        const message = data.message;
        
        // Parse multilingual message from backend
        if (message.includes(' | ')) {
          return parseMultilingualMessage(message);
        }
        
        // Handle legacy single-language constraint violations
        if (message.includes('Пользователь с таким именем пользователя уже существует')) {
          return currentLanguage === 'uz'
            ? 'Bunday foydalanuvchi nomi bilan foydalanuvchi allaqachon tizimda ro\'yxatdan o\'tgan'
            : 'Пользователь с таким именем пользователя уже зарегистрирован в системе';
        }
        if (message.includes('Пользователь с таким именем уже существует')) {
          return currentLanguage === 'uz'
            ? 'Bunday ismli foydalanuvchi allaqachon ro\'yxatdan o\'tgan'
            : 'Пользователь с таким именем уже зарегистрирован';
        }
        if (message.includes('Группа с таким названием уже существует')) {
          return currentLanguage === 'uz'
            ? 'Bunday nomli guruh allaqachon yaratilgan'
            : 'Группа с таким названием уже создана';
        }
        if (message.includes('Данные уже существуют в системе')) {
          return currentLanguage === 'uz'
            ? 'Bunday ma\'lumotlar allaqachon tizimda mavjud'
            : 'Такие данные уже существуют в системе';
        }
        
        return message;
      }
      return currentLanguage === 'uz'
        ? 'Noto\'g\'ri ma\'lumotlar. Kiritilgan ma\'lumotlarni tekshiring va qayta urinib ko\'ring.'
        : 'Неверные данные. Проверьте введенную информацию и попробуйте снова.';
    }

    // Handle 422 Unprocessable Entity (Validation errors)
    if (status === 422) {
      if (data?.message && typeof data.message === 'string') {
        return parseMultilingualMessage(data.message);
      }
      return currentLanguage === 'uz'
        ? 'Iltimos, kiritilgan ma\'lumotlarni tekshiring va qayta urinib ko\'ring.'
        : 'Пожалуйста, проверьте введенные данные и попробуйте снова.';
    }

    // Handle 500 Server Error
    if (status === 500) {
      return currentLanguage === 'uz'
        ? 'Serverda xatolik yuz berdi. Iltimos, keyinroq urinib ko\'ring.'
        : 'Произошла ошибка на сервере. Пожалуйста, попробуйте позже.';
    }

    // Handle other 5xx Server Errors
    if (status >= 500) {
      return currentLanguage === 'uz'
        ? 'Server xatoligi yuz berdi. Iltimos, keyinroq urinib ko\'ring.'
        : 'Произошла ошибка сервера. Пожалуйста, попробуйте позже.';
    }

    // If server provided a custom message, use it for non-sensitive errors
    if (data?.message && typeof data.message === 'string' && status < 500) {
      return parseMultilingualMessage(data.message);
    }
  }

  // If no network response (network error)
  if (error.request && !error.response) {
    return currentLanguage === 'uz'
      ? 'Tarmoq xatoligi. Internet ulanishingizni tekshiring va qayta urinib ko\'ring.'
      : 'Ошибка сети. Проверьте подключение к интернету и попробуйте снова.';
  }

  // If error is in request setup
  if (error.message) {
    if (error.message.includes('timeout')) {
      return currentLanguage === 'uz'
        ? 'Kutish vaqti tugadi. Qayta urinib ko\'ring.'
        : 'Время ожидания истекло. Попробуйте снова.';
    }
    // Don't expose raw error messages
    return localizedDefaultMessage;
  }

  return localizedDefaultMessage;
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
