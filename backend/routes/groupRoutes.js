const router = require("express").Router();
const groupsController = require("../controllers/groupsController");
const { protectAdmin } = require("../middlewares/auth");
const checkPermission = require("../middlewares/checkPermission");

router.get("/", protectAdmin, checkPermission("group:read"), groupsController.getAllGroups);
router.get("/:groupId", protectAdmin, checkPermission("group:read"), groupsController.getGroup);
router.post("/", protectAdmin, checkPermission("group:create"), groupsController.createGroup);
router.put("/:groupId", protectAdmin, checkPermission("group:update"), groupsController.updateGroup);
router.delete("/:groupId", protectAdmin, checkPermission("group:delete"), groupsController.deleteGroup);

router.get("/subgroups/:parentId", protectAdmin, checkPermission("group:read"), groupsController.getGroupByParentId);

module.exports = router;