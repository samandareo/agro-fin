const router = require("express").Router();
const permissionController = require("../controllers/permissionController");
const { protectAdmin } = require("../middlewares/auth");
const checkPermission = require("../middlewares/checkPermission");

router.route("/")
    .get(protectAdmin, checkPermission("permission:assign"), permissionController.getAllPermissions)
    .post(protectAdmin, checkPermission("permission:assign"), permissionController.createPermission);

router.route("/:permissionId")
    .get(protectAdmin, checkPermission("permission:assign"), permissionController.getPermission)
    .put(protectAdmin, checkPermission("permission:assign"), permissionController.updatePermission)
    .delete(protectAdmin, checkPermission("permission:revoke"), permissionController.deletePermission);

module.exports = router;