const Notification = require("../models/Notification");
const ApiResponse = require("../utils/apiResponse");

// Admin: Send notification to all users
exports.sendNotification = async (req, res, next) => {
    try {
        const { title, message } = req.body;
        const senderId = req.admin.id;
        const senderName = req.admin.name || 'Admin';

        if (!title || !message) {
            return ApiResponse.badRequest("Title and message are required").send(res);
        }

        // Create notification
        const notification = await Notification.create({
            title,
            message,
            senderId,
            senderName
        });

        if (!notification) {
            return ApiResponse.error("Failed to create notification").send(res);
        }

        // Send to all users
        const userNotifications = await Notification.sendToAllUsers(notification.id);

        return ApiResponse.success({
            notification,
            recipientsCount: userNotifications.length
        }, "Notification sent successfully").send(res);

    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

// Admin: Get all notifications with search
exports.getAllNotifications = async (req, res, next) => {
    try {
        const {
            title,
            message,
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

        const filters = {
            title,
            message,
            limit: limitNum,
            offset: (pageNum - 1) * limitNum
        };

        const [notifications, totalCount] = await Promise.all([
            Notification.findAll(filters),
            Notification.findAll({ ...filters, limit: undefined, offset: undefined })
        ]);

        const totalPages = Math.ceil(totalCount.length / limitNum);

        return ApiResponse.success({
            notifications,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount: totalCount.length,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }, "Notifications fetched successfully").send(res);

    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

// Admin: Delete notification
exports.deleteNotification = async (req, res, next) => {
    try {
        const { notificationId } = req.params;

        if (!notificationId) {
            return ApiResponse.badRequest("Notification ID is required").send(res);
        }

        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return ApiResponse.notFound("Notification not found").send(res);
        }

        const deletedNotification = await Notification.deleteById(notificationId);

        return ApiResponse.success(deletedNotification, "Notification deleted successfully").send(res);

    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

// User: Get user notifications
exports.getUserNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const {
            isRead,
            page = 1,
            limit = 20
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        if (isNaN(pageNum) || pageNum < 1) {
            return ApiResponse.badRequest("Invalid page number").send(res);
        }
        
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return ApiResponse.badRequest("Invalid limit (1-100)").send(res);
        }

        const filters = {
            isRead: isRead !== undefined ? isRead === 'true' : undefined,
            limit: limitNum,
            offset: (pageNum - 1) * limitNum
        };

        const notifications = await Notification.getUserNotifications(userId, filters);
        const totalCount = await Notification.getUserNotifications(userId, { 
            isRead: filters.isRead 
        });

        const totalPages = Math.ceil(totalCount.length / limitNum);

        return ApiResponse.success({
            notifications,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount: totalCount.length,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }, "User notifications fetched successfully").send(res);

    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

// User: Get unread count
exports.getUnreadCount = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const count = await Notification.getUnreadCount(userId);

        return ApiResponse.success({ unreadCount: count }, "Unread count fetched successfully").send(res);

    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

// User: Mark notification as read
exports.markAsRead = async (req, res, next) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        if (!notificationId) {
            return ApiResponse.badRequest("Notification ID is required").send(res);
        }

        const result = await Notification.markAsRead(notificationId, userId);

        if (!result) {
            return ApiResponse.notFound("Notification not found").send(res);
        }

        return ApiResponse.success(result, "Notification marked as read").send(res);

    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

// User: Mark all notifications as read
exports.markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await Notification.markAllAsRead(userId);

        return ApiResponse.success({ 
            markedCount: result.length 
        }, "All notifications marked as read").send(res);

    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}
