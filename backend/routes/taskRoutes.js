const router = require("express").Router();
const taskController = require("../controllers/taskController");
const { protectUser, protectAdmin } = require("../middlewares/auth");
const checkPermission = require("../middlewares/checkPermission");
const upload = require("../utils/multerConfig");

// User routes
router.get("/user/my-tasks", protectUser, checkPermission("task:read"), taskController.getMyTasks);
router.get("/user/active-tasks", protectUser, checkPermission("task:read"), taskController.getMyActiveTasks);
router.get("/user/archived-tasks", protectUser, checkPermission("task:read"), taskController.getMyArchivedTasks);
router.get("/user/:taskId", protectUser, checkPermission("task:read"), taskController.getTaskDetail);
router.put("/user/:taskId/status", protectUser, checkPermission("task:update"), taskController.updateTaskStatus);
router.post("/user/:taskId/upload-file", protectUser, checkPermission("task:update"), upload.single("file"), taskController.uploadTaskFileUser);
router.delete("/user/file/:fileId", protectUser, checkPermission("task:update"), taskController.deleteTaskFileUser);

// Admin routes
router.get("/admin/all", protectAdmin, checkPermission("task:read"), taskController.getAllTasks);

// Route that handles both admin and director - calls appropriate method based on role
router.get("/admin/active-tasks", protectAdmin, checkPermission("task:read"), (req, res, next) => {
  if (req.admin.role === 'director') {
    return taskController.getActiveTasksDirector(req, res, next);
  }
  taskController.getActiveTasksAdmin(req, res, next);
});

router.get("/admin/archived-tasks", protectAdmin, checkPermission("task:read"), (req, res, next) => {
  if (req.admin.role === 'director') {
    return taskController.getArchivedTasksDirector(req, res, next);
  }
  taskController.getArchivedTasksAdmin(req, res, next);
});
router.get("/admin/my-files", protectAdmin, checkPermission("task:read"), taskController.getMyUploadedFiles);
router.get("/admin/:taskId/detail", protectAdmin, checkPermission("task:read"), taskController.getTaskDetailAdmin);
router.post("/admin/create", protectAdmin, checkPermission("task:create"), taskController.createTask);
router.put("/admin/:taskId", protectAdmin, checkPermission("task:update"), taskController.updateTask);
router.delete("/admin/:taskId", protectAdmin, checkPermission("task:delete"), taskController.deleteTask);

// Assign/Remove users
router.post("/admin/:taskId/assign", protectAdmin, checkPermission("task:manage"), taskController.assignUserToTask);
router.delete("/admin/:taskId/user/:userId", protectAdmin, checkPermission("task:manage"), taskController.removeUserFromTask);
router.get("/admin/:taskId/users", protectAdmin, checkPermission("task:read"), taskController.getTaskUsers);

// File management
router.post("/admin/:taskId/upload-file", protectAdmin, checkPermission("task:manage"), upload.single("file"), taskController.uploadTaskFile);

// Custom middleware: Allow both users and admins to download files
const authenticateUserOrAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Try to verify as user first
    const jwt = require('../utils/jwt');
    const decoded = jwt.verifyAccessToken(token);

    // Try to find as user
    const User = require('../models/User');
    const user = await User.findOne(decoded.id);
    if (user) {
      req.user = user;
      return next();
    }

    // Try to find as admin
    const Admin = require('../models/Admin');
    const admin = await Admin.findOne(decoded.id);
    if (admin) {
      req.admin = admin;
      return next();
    }

    return res.status(401).json({ message: 'Unauthorized' });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

router.get("/file/:fileId/download", authenticateUserOrAdmin, taskController.downloadTaskFile);
router.delete("/admin/file/:fileId", protectAdmin, checkPermission("task:manage"), taskController.deleteTaskFile);

module.exports = router;
