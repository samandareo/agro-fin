const fs = require('fs');
const path = require('path');

/**
 * Delete a file from the upload directory
 * @param {string} filename - The filename to delete
 * @param {string} uploadDir - The upload directory path
 * @returns {Promise<boolean>} - True if file was deleted, false otherwise
 */
const deleteFile = async (filename, uploadDir = path.join(__dirname, '..', 'agro-reports')) => {
    try {
        if (!filename) return false;
        
        const filePath = path.join(uploadDir, filename);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`File deleted: ${filename}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`Error deleting file ${filename}:`, error);
        return false;
    }
};

/**
 * Get file size in bytes
 * @param {string} filename - The filename
 * @param {string} uploadDir - The upload directory path
 * @returns {Promise<number>} - File size in bytes, -1 if file doesn't exist
 */
const getFileSize = async (filename, uploadDir = path.join(__dirname, '..', 'agro-reports')) => {
    try {
        if (!filename) return -1;
        
        const filePath = path.join(uploadDir, filename);
        
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            return stats.size;
        }
        
        return -1;
    } catch (error) {
        console.error(`Error getting file size for ${filename}:`, error);
        return -1;
    }
};

/**
 * Check if file exists
 * @param {string} filename - The filename
 * @param {string} uploadDir - The upload directory path
 * @returns {boolean} - True if file exists, false otherwise
 */
const fileExists = (filename, uploadDir = path.join(__dirname, '..', 'agro-reports')) => {
    try {
        if (!filename) return false;
        
        const filePath = path.join(uploadDir, filename);
        return fs.existsSync(filePath);
    } catch (error) {
        console.error(`Error checking file existence for ${filename}:`, error);
        return false;
    }
};

module.exports = {
    deleteFile,
    getFileSize,
    fileExists
};
