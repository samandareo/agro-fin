const Document = require("../models/Document");
const User = require("../models/User");
const ApiResponse = require("../utils/apiResponse");
const { deleteFile, fileExists } = require("../utils/fileUtils");
const { isValidDate, isValidYear, isValidMonth, isValidDateRange } = require("../utils/dateUtils");
const path = require("path");
const fs = require("fs");

exports.getAllDocuments = async (req, res, next) => {
    try {
        const documents = await Document.findAll();

        if (!documents) {
            return ApiResponse.badRequest("Documents not found").send(res);
        }

        return ApiResponse.success(documents, "Documents fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.getDocument = async (req, res, next) => {
    try {
        const { documentId } = req.params;

        if (!documentId) {
            return ApiResponse.badRequest("Document ID is required").send(res);
        }

        const document = await Document.findOne(documentId);
        
        if (!document) {
            return ApiResponse.badRequest("Document not found").send(res);
        }

        return ApiResponse.success(document, "Document fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.getAllUploadedDocuments = async (req, res, next) => {
    try {
        const { uploaderId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        if (isNaN(pageNum) || pageNum < 1) {
            return ApiResponse.badRequest("Invalid page number").send(res);
        }
        
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return ApiResponse.badRequest("Invalid limit (1-100)").send(res);
        }

        const offset = (pageNum - 1) * limitNum;

        const documents = await Document.findByUploaderIdWithPagination(uploaderId, limitNum, offset);
        const totalCount = await Document.countByUploaderId(uploaderId);

        if (!documents) {
            return ApiResponse.badRequest("Documents not found").send(res);
        }

        const totalPages = Math.ceil(totalCount / limitNum);

        return ApiResponse.success({
            documents,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }, "Documents fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.getAllUploadedDocumentsByGroup = async (req, res, next) => {
    try {
        const uploaderId = req.user.id;
        const documents = await Document.findAllByGroupAndUploaderId(uploaderId);

        if (!documents) {
            return ApiResponse.badRequest("Documents not found").send(res);
        }

        return ApiResponse.success(documents, "Documents fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.createDocument = async (req, res, next) => {
    try {
        const { title } = req.body;

        if (!title || !req.file) {
            return ApiResponse.badRequest("All fields are required").send(res);
        }

        const uploaderId = req.user.id;
        const userGroup = await User.findUserGroup(uploaderId);
        if (!userGroup) {
            return ApiResponse.badRequest("User group not found").send(res);
        }

        const uploaderName = req.user.name;
        const uploaderTelegramId = req.user.telegram_id;
        const filePath = req.file.filename;
        const groupName = userGroup.name;
        const groupId = userGroup.id;

        const document = await Document.create({ title, groupId, uploaderId, filePath, uploaderName, uploaderTelegramId, groupName })

        if (!document) {
            return ApiResponse.error("Failed to create document").send(res);
        }

        return ApiResponse.success(document, "Document created successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.updateDocument = async (req, res, next) => {
    try {
        const { documentId } = req.params;
        const { title } = req.body;

        const existingDocument = await Document.findOne(documentId);
        if (!existingDocument) {
            return ApiResponse.badRequest("Document not found").send(res);
        }

        const uploaderId = req.user.id;
        const updateData = {
            title: existingDocument.title || "",
            uploaderId: uploaderId,
            filePath: existingDocument.file_path || "",
        };

        if (title) {
            updateData.title = title;
        }

        if (req.file) {
            deleteFile(existingDocument.file_path);
            updateData.filePath = req.file.filename;
        } else {
            updateData.filePath = existingDocument.file_path;
        }

        const document = await Document.findByIdAndUpdate(documentId, updateData);

        if (!document) {
            return ApiResponse.error("Failed to update document").send(res);
        }

        return ApiResponse.success(document, "Document updated successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.deleteDocument = async (req, res, next) => {
    try {
        const { documentId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!documentId) {
            return ApiResponse.badRequest("Document ID is required").send(res);
        }

        const document = await Document.findOne(documentId);
        if (!document) {
            return ApiResponse.badRequest("Document not found").send(res);
        }

        if (userRole !== 'admin' && document.uploader_id !== userId) {
            return ApiResponse.forbidden("You don't have permission to delete this document").send(res);
        }

        if (userRole === 'admin') {
            const deletedDocument = await Document.findByIdAndDelete(documentId);
            if (deletedDocument) {
                deleteFile(deletedDocument.file_path);
            }
            return ApiResponse.success(deletedDocument, "Document deleted successfully").send(res);
        }

        const DeleteRequests = require("../models/DeleteRequests");
        const pool = require("../config/db");
        
        const existingRequest = await pool.query(
            "SELECT * FROM delete_requests WHERE document_id = $1 AND requester_id = $2 AND status = 'pending'",
            [documentId, userId]
        );
        
        if (existingRequest.rows.length > 0) {
            return ApiResponse.badRequest("Delete request already exists for this document").send(res);
        }
        
        const deleteRequest = await DeleteRequests.create({ 
            documentId, 
            requesterId: userId, 
            status: 'pending' 
        });
        
        if (!deleteRequest) {
            return ApiResponse.error("Failed to create delete request").send(res);
        }
        
        return ApiResponse.success(deleteRequest, "Delete request sent to admin successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.getFilteredDocuments = async (req, res, next) => {
    try {
        const {
            year,
            month,
            date,
            startDate,
            endDate,
            groupId,
            uploaderId,
            uploaderName,
            title,
            page = 1,
            limit = 10
        } = req.query;

        if (year && !isValidYear(year)) {
            return ApiResponse.badRequest("Invalid year format").send(res);
        }

        if (month && !isValidMonth(month)) {
            return ApiResponse.badRequest("Invalid month format (1-12)").send(res);
        }

        if (date && !isValidDate(date)) {
            return ApiResponse.badRequest("Invalid date format (YYYY-MM-DD)").send(res);
        }

        if (startDate && !isValidDate(startDate)) {
            return ApiResponse.badRequest("Invalid start date format (YYYY-MM-DD)").send(res);
        }

        if (endDate && !isValidDate(endDate)) {
            return ApiResponse.badRequest("Invalid end date format (YYYY-MM-DD)").send(res);
        }

        if (startDate && endDate && !isValidDateRange(startDate, endDate)) {
            return ApiResponse.badRequest("Invalid date range: start date must be before end date").send(res);
        }

        const filters = {};

        if (year) filters.year = parseInt(year);
        if (month) filters.month = parseInt(month);
        if (date) filters.date = date;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        if (groupId) {
            const groupIdNum = parseInt(groupId);
            if (isNaN(groupIdNum)) {
                return ApiResponse.badRequest("Invalid group ID").send(res);
            }
            filters.groupId = groupIdNum;
        }

        if (uploaderId) {
            const uploaderIdNum = parseInt(uploaderId);
            if (isNaN(uploaderIdNum)) {
                return ApiResponse.badRequest("Invalid uploader ID").send(res);
            }
            filters.uploaderId = uploaderIdNum;
        }
        if (uploaderName) filters.uploaderName = uploaderName;

        if (title) filters.title = title;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        if (isNaN(pageNum) || pageNum < 1) {
            return ApiResponse.badRequest("Invalid page number").send(res);
        }
        
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return ApiResponse.badRequest("Invalid limit (1-100)").send(res);
        }

        filters.offset = (pageNum - 1) * limitNum;
        filters.limit = limitNum;

        const [documents, totalCount] = await Promise.all([
            Document.findWithFilters(filters),
            Document.countWithFilters(filters)
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        return ApiResponse.success({
            documents,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }, "Filtered documents fetched successfully").send(res);

    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.getFilterOptions = async (req, res, next) => {
    try {
        const pool = require("../config/db");

        const { rows: years } = await pool.query(`
            SELECT DISTINCT EXTRACT(YEAR FROM created_at) as year
            FROM documents
            ORDER BY year DESC
        `);

        const { rows: months } = await pool.query(`
            SELECT DISTINCT EXTRACT(MONTH FROM created_at) as month
            FROM documents
            ORDER BY month
        `);

        const { rows: groups } = await pool.query(`
            WITH RECURSIVE all_groups AS (
                SELECT id, name, parent_id, 0 as level
                FROM groups 
                WHERE parent_id IS NULL
                
                UNION ALL
                
                SELECT g.id, g.name, g.parent_id, ag.level + 1
                FROM groups g
                INNER JOIN all_groups ag ON g.parent_id = ag.id
            )
            SELECT id, name, level, parent_id
            FROM all_groups
            ORDER BY level, name
        `);

        const { rows: uploaders } = await pool.query(`
            SELECT DISTINCT u.id, u.name, u.telegram_id
            FROM users u
            INNER JOIN documents d ON u.id = d.uploader_id
            WHERE u.status = true
            ORDER BY u.name
        `);

        return ApiResponse.success({
            years: years.map(row => row.year),
            months: months.map(row => row.month),
            groups,
            uploaders
        }, "Filter options fetched successfully").send(res);

    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.getUserFilteredDocuments = async (req, res, next) => {
    try {
        const {
            year,
            month,
            date,
            startDate,
            endDate,
            groupId,
            title,
            page = 1,
            limit = 10
        } = req.query;

        const userId = req.user.id;

        if (year && !isValidYear(year)) {
            return ApiResponse.badRequest("Invalid year format").send(res);
        }

        if (month && !isValidMonth(month)) {
            return ApiResponse.badRequest("Invalid month format (1-12)").send(res);
        }

        if (date && !isValidDate(date)) {
            return ApiResponse.badRequest("Invalid date format (YYYY-MM-DD)").send(res);
        }

        if (startDate && !isValidDate(startDate)) {
            return ApiResponse.badRequest("Invalid start date format (YYYY-MM-DD)").send(res);
        }

        if (endDate && !isValidDate(endDate)) {
            return ApiResponse.badRequest("Invalid end date format (YYYY-MM-DD)").send(res);
        }

        if (startDate && endDate && !isValidDateRange(startDate, endDate)) {
            return ApiResponse.badRequest("Invalid date range: start date must be before end date").send(res);
        }

        const filters = {};

        if (year) filters.year = parseInt(year);
        if (month) filters.month = parseInt(month);
        if (date) filters.date = date;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        if (groupId) {
            const groupIdNum = parseInt(groupId);
            if (isNaN(groupIdNum)) {
                return ApiResponse.badRequest("Invalid group ID").send(res);
            }
            filters.groupId = groupIdNum;
        }

        if (title) filters.title = title;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        if (isNaN(pageNum) || pageNum < 1) {
            return ApiResponse.badRequest("Invalid page number").send(res);
        }
        
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
            return ApiResponse.badRequest("Invalid limit (1-50)").send(res);
        }

        filters.offset = (pageNum - 1) * limitNum;
        filters.limit = limitNum;

        const [documents, totalCount] = await Promise.all([
            Document.findUserDocumentsWithFilters(userId, filters),
            Document.countUserDocumentsWithFilters(userId, filters)
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        return ApiResponse.success({
            documents,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }, "Your filtered documents fetched successfully").send(res);

    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.getUserFilterOptions = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const filterOptions = await Document.getUserFilterOptions(userId);

        return ApiResponse.success(filterOptions, "Your filter options fetched successfully").send(res);

    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.downloadDocument = async (req, res, next) => {
    try {
        const { documentId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!documentId) {
            return ApiResponse.badRequest("Document ID is required").send(res);
        }

        const document = await Document.findOne(documentId);
        if (!document) {
            return ApiResponse.badRequest("Document not found").send(res);
        }

        if (userRole !== 'admin') {
            const userGroup = await User.findUserGroup(userId);
            if (!userGroup || userGroup.id !== document.group_id) {
                return ApiResponse.forbidden("You don't have permission to download this document").send(res);
            }
        }

        const filePath = path.join(__dirname, '..', 'agro-reports', document.file_path);
        if (!fileExists(document.file_path)) {
            return ApiResponse.badRequest("File not found on server").send(res);
        }

        const fileName = document.title + path.extname(document.file_path);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        const fileStream = fs.createReadStream(filePath);
        
        fileStream.on('error', (error) => {
            console.error('Error streaming file:', error);
            if (!res.headersSent) {
                return ApiResponse.error("Error reading file").send(res);
            }
        });

        fileStream.pipe(res);

        console.log(`Document ${documentId} downloaded by user ${userId} (${userRole})`);

    } catch (error) {
        console.error('Download error:', error);
        return ApiResponse.error(error.message).send(res);
    }
}

exports.getDocumentInfo = async (req, res, next) => {
    try {
        const { documentId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!documentId) {
            return ApiResponse.badRequest("Document ID is required").send(res);
        }

        const document = await Document.findOne(documentId);
        if (!document) {
            return ApiResponse.badRequest("Document not found").send(res);
        }

        if (userRole !== 'admin') {
            const userGroup = await User.findUserGroup(userId);
            if (!userGroup || userGroup.id !== document.group_id) {
                return ApiResponse.forbidden("You don't have permission to access this document").send(res);
            }
        }

        const fileExists = require("../utils/fileUtils").fileExists;
        const fileExistsOnServer = fileExists(document.file_path);

        let fileSize = 0;
        if (fileExistsOnServer) {
            const filePath = path.join(__dirname, '..', 'agro-reports', document.file_path);
            try {
                const stats = fs.statSync(filePath);
                fileSize = stats.size;
            } catch (error) {
                console.error('Error getting file stats:', error);
            }
        }

        return ApiResponse.success({
            id: document.id,
            title: document.title,
            fileName: document.file_path,
            fileSize: fileSize,
            fileExists: fileExistsOnServer,
            uploaderName: document.uploader_name,
            groupName: document.group_name,
            createdAt: document.created_at,
            downloadUrl: `/api/documents/${documentId}/download`
        }, "Document info retrieved successfully").send(res);

    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}