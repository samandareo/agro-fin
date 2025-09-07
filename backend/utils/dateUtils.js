/**
 * Date filtering utilities for document management
 */

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

/**
 * Validate year (4 digits)
 * @param {number|string} year - Year to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidYear = (year) => {
    const yearNum = parseInt(year);
    return yearNum >= 1900 && yearNum <= new Date().getFullYear() + 1;
};

/**
 * Validate month (1-12)
 * @param {number|string} month - Month to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidMonth = (month) => {
    const monthNum = parseInt(month);
    return monthNum >= 1 && monthNum <= 12;
};

/**
 * Get date range for a specific year
 * @param {number} year - Year
 * @returns {object} - Object with startDate and endDate
 */
const getYearDateRange = (year) => {
    return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`
    };
};

/**
 * Get date range for a specific year and month
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {object} - Object with startDate and endDate
 */
const getMonthDateRange = (year, month) => {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    return { startDate, endDate };
};

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} - Current date
 */
const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
};

/**
 * Get date N days ago
 * @param {number} days - Number of days ago
 * @returns {string} - Date string
 */
const getDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
};

/**
 * Get start and end of current month
 * @returns {object} - Object with startDate and endDate
 */
const getCurrentMonthRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return getMonthDateRange(year, month);
};

/**
 * Get start and end of current year
 * @returns {object} - Object with startDate and endDate
 */
const getCurrentYearRange = () => {
    const year = new Date().getFullYear();
    return getYearDateRange(year);
};

/**
 * Format date for display
 * @param {string} dateString - Date string
 * @returns {string} - Formatted date
 */
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Get month name from number
 * @param {number} month - Month number (1-12)
 * @returns {string} - Month name
 */
const getMonthName = (month) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Invalid Month';
};

/**
 * Validate date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {boolean} - True if valid range, false otherwise
 */
const isValidDateRange = (startDate, endDate) => {
    if (!isValidDate(startDate) || !isValidDate(endDate)) return false;
    return new Date(startDate) <= new Date(endDate);
};

module.exports = {
    isValidDate,
    isValidYear,
    isValidMonth,
    getYearDateRange,
    getMonthDateRange,
    getCurrentDate,
    getDaysAgo,
    getCurrentMonthRange,
    getCurrentYearRange,
    formatDate,
    getMonthName,
    isValidDateRange
};
