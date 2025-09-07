const router = require("express").Router();
const adminController = require("../controllers/adminController");
const { protectAdmin } = require("../middlewares/auth");
const checkPermission = require("../middlewares/checkPermission");

router.post("/register", adminController.register);
router.post("/login", adminController.login);
router.post("/refresh", adminController.refreshToken);

router.put("/", protectAdmin, adminController.updateAdmin);
router.get("/", protectAdmin, adminController.getAdmin);

router.get("/users", protectAdmin, checkPermission("user:read"), adminController.getUsers);
router.post("/users", protectAdmin, checkPermission("user:create"), adminController.createUser);
router.put("/users/:userId", protectAdmin, checkPermission("user:update"), adminController.updateUser);
router.delete("/users/:userId", protectAdmin, checkPermission("user:delete"), adminController.deleteUser);
router.get("/users/:userId", protectAdmin, checkPermission("user:read"), adminController.getUser);

router.get("/search/users", protectAdmin, checkPermission("user:read"), adminController.searchUsers);
router.get("/search/documents", protectAdmin, checkPermission("document:read"), adminController.searchDocuments);

module.exports = router;