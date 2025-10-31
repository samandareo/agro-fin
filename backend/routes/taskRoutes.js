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
// Allow both users and admins to download files (access check is done in controller)
router.get("/file/:fileId/download", (req, res, next) => {
  // Authenticate as either user or admin
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  // Try user auth first
  protectUser(req, res, (userErr) => {
    if (userErr && !req.user) {
      // If user auth fails, try admin auth
      protectAdmin(req, res, (adminErr) => {
        if (adminErr && !req.admin) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
        next();
      });
    } else {
      next();
    }
  });
}, taskController.downloadTaskFile);
router.delete("/admin/file/:fileId", protectAdmin, checkPermission("task:manage"), taskController.deleteTaskFile);

module.exports = router;
