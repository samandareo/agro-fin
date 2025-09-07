const DeleteRequests = require("../models/DeleteRequests");
const Document = require("../models/Document");
const ApiResponse = require("../utils/apiResponse");
const pool = require("../config/db");
const { deleteFile } = require("../utils/fileUtils");

exports.getAllDeleteRequests = async (req, res, next) => {
    try {
        const {
            status,
            page = 1,
            limit = 10
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        if (isNaN(pageNum) || pageNum < 1) {
            return ApiResponse.badRequest("Invalid page number").send(res);
        }
        
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return ApiResponse.badRequest("Invalid limit (1-100)").send(res);
        }

        const offset = (pageNum - 1) * limitNum;

        const filters = {};
        if (status) filters.status = status;
        filters.offset = offset;
        filters.limit = limitNum;

        const [deleteRequests, totalCount] = await Promise.all([
            DeleteRequests.findAll(filters),
            DeleteRequests.countWithFilters(filters)
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        return ApiResponse.success({
            requests: deleteRequests,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }, "Delete requests fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.getDeleteRequest = async (req, res, next) => {
    try {
        const { deleteRequestId } = req.params;
        const deleteRequest = await DeleteRequests.findOne(deleteRequestId);
        if (!deleteRequest) {
            return ApiResponse.badRequest("Delete request not found").send(res);
        }
        return ApiResponse.success(deleteRequest, "Delete request fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.getAllDeleteRequestsByStatus = async (req, res, next) => {
    try {
        const { status } = req.params;
        const deleteRequests = await DeleteRequests.findAllByStatus(status);
        if (!deleteRequests) {
            return ApiResponse.badRequest("Delete requests not found").send(res);
        }
        return ApiResponse.success(deleteRequests, "Delete requests fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.createDeleteRequest = async (req, res, next) => {
    try {
        const { documentId, requesterId, status } = req.body;
        const deleteRequest = await DeleteRequests.create({ documentId, requesterId, status });
        if (!deleteRequest) {
            return ApiResponse.error("Failed to create delete request").send(res);
        }
        return ApiResponse.success(deleteRequest, "Delete request created successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.updateDeleteRequest = async (req, res, next) => {
    try {
        const { deleteRequestId } = req.params;
        const { status } = req.body;

        const deleteRequest = await DeleteRequests.findByIdAndUpdate(deleteRequestId, { status });
        console.log(deleteRequest);
        if (status === "approved") {
            const document = await Document.findByIdAndDelete(deleteRequest.document_id);
            console.log(document);
            if (!document) {
                return ApiResponse.badRequest("Document not found").send(res);
            }
            deleteFile(document.file_path);
        }
        if (!deleteRequest) {
            return ApiResponse.badRequest("Delete request not found").send(res);
        }
        return ApiResponse.success(deleteRequest, "Delete request updated successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.getUserDeleteRequests = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const deleteRequests = await DeleteRequests.findUserDeleteRequests(userId);
        
        return ApiResponse.success(deleteRequests, "Your delete requests fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.createUserDeleteRequest = async (req, res, next) => {
    try {
        const { documentId } = req.params;
        const requesterId = req.user.id;
        
        const Document = require("../models/Document");
        const document = await Document.findOne(documentId);
        
        if (!document) {
            return ApiResponse.badRequest("Document not found").send(res);
        }

        const existingRequest = await pool.query(
            "SELECT * FROM delete_requests WHERE document_id = $1 AND requester_id = $2 AND status = 'pending'",
            [documentId, requesterId]
        );
        
        if (existingRequest.rows.length > 0) {
            return ApiResponse.badRequest("Delete request already exists for this document").send(res);
        }
        
        const deleteRequest = await DeleteRequests.create({ 
            documentId, 
            requesterId, 
            status: 'pending' 
        });
        
        if (!deleteRequest) {
            return ApiResponse.error("Failed to create delete request").send(res);
        }
        
        return ApiResponse.success(deleteRequest, "Delete request created successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.getPendingDeleteRequestsCount = async (req, res, next) => {
    try {
        const count = await DeleteRequests.countByStatus('pending');
        return ApiResponse.success({ count }, "Pending delete requests count fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}