const router = require("express").Router();
const notificationController = require("../controllers/notificationController");
const { protectAdmin, protectUser } = require("../middlewares/auth");

// Admin routes
router.post("/admin/send", protectAdmin, notificationController.sendNotification);
router.get("/admin/all", protectAdmin, notificationController.getAllNotifications);
router.delete("/admin/:notificationId", protectAdmin, notificationController.deleteNotification);

// User routes
router.get("/user/notifications", protectUser, notificationController.getUserNotifications);
router.get("/user/unread-count", protectUser, notificationController.getUnreadCount);
router.put("/user/mark-read/:notificationId", protectUser, notificationController.markAsRead);
router.put("/user/mark-all-read", protectUser, notificationController.markAllAsRead);

module.exports = router;
