/**
 * Get file extension from file path
 * @param {string} filePath - File path
 * @returns {string} - File extension
 */
export const getFileExtension = (filePath) => {
  if (!filePath) return '';
  const parts = filePath.split('.');
  return parts.length > 1 ? parts.pop() : '';
};

/**
 * Generate download filename with proper extension
 * @param {string} title - Document title
 * @param {string} filePath - File path
 * @returns {string} - Download filename
 */
export const generateDownloadFileName = (title, filePath) => {
  const extension = getFileExtension(filePath);
  return extension ? `${title}.${extension}` : title;
};

/**
 * Get file type icon based on file extension
 * @param {string} filePath - File path
 * @returns {string} - File type icon
 */
export const getFileTypeIcon = (filePath) => {
  const extension = getFileExtension(filePath).toLowerCase();
  switch (extension) {
    case 'pdf': return '📄';
    case 'doc':
    case 'docx': return '📝';
    case 'xls':
    case 'xlsx': return '📊';
    case 'ppt':
    case 'pptx': return '📈';
    case 'txt': return '📜';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif': return '🖼️';
    default: return '📁';
  }
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Convert date from YYYY-MM-DD (ISO format) to DD/MM/YYYY
 * @param {string} isoDate - Date in YYYY-MM-DD format
 * @returns {string} - Date in DD/MM/YYYY format
 */
export const formatDateToDDMMYYYY = (isoDate) => {
  if (!isoDate) return '';
  
  try {
    const date = new Date(isoDate);
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Convert date from DD/MM/YYYY to YYYY-MM-DD (ISO format)
 * @param {string} ddmmDate - Date in DD/MM/YYYY format
 * @returns {string} - Date in YYYY-MM-DD format
 */
export const formatDateToISO = (ddmmDate) => {
  if (!ddmmDate) return '';
  const [day, month, year] = ddmmDate.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Validate DD/MM/YYYY date format
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if valid DD/MM/YYYY format
 */
export const isValidDDMMYYYY = (dateString) => {
  if (!dateString) return false;
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = dateString.match(regex);
  
  if (!match) return false;
  
  const [, day, month, year] = match;
  const date = new Date(year, month - 1, day);
  
  return date.getDate() === day && 
         date.getMonth() === month - 1 && 
         date.getFullYear() === year;
};
