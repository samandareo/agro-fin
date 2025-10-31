
export const getFileExtension = (filePath) => {
  if (!filePath) return '';
  const parts = filePath.split('.');
  if (parts.length < 2) return '';
  return `.${parts.pop()}`;
};


export const generateDownloadFileName = (title, filePath) => {
  const extension = getFileExtension(filePath);
  return `${title}${extension}`;
};


export const getFileTypeIcon = (filePath) => {
  const extension = getFileExtension(filePath).toLowerCase();
  
  switch (extension) {
    case '.pdf':
      return '📄';
    case '.doc':
    case '.docx':
      return '📝';
    case '.xls':
    case '.xlsx':
      return '📊';
    case '.ppt':
    case '.pptx':
      return '📈';
    case '.txt':
      return '📃';
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.gif':
      return '🖼️';
    default:
      return '📄';
  }
};


export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


export const formatDateToDDMMYYYY = (isoDate) => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};


export const formatDateToISO = (ddmmDate) => {
  if (!ddmmDate) return '';
  const [day, month, year] = ddmmDate.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};


export const isValidDDMMYYYY = (dateString) => {
  if (!dateString) return false;
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = dateString.match(regex);

  if (!match) return false;

  const [, day, month, year] = match;
  const date = new Date(year, month - 1, day);

  return date.getDate() == day &&
         date.getMonth() == month - 1 &&
         date.getFullYear() == year;
};

export const formatDateTimeTo24Hour = (isoDateTime) => {
  if (!isoDateTime) return '';

  try {
    const date = new Date(isoDateTime);

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
    console.error('Error formatting datetime:', error);
    return '';
  }
};
