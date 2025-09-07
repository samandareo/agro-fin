const router = require("express").Router();
const rolePermissionController = require("../controllers/rolePermissionController");
const { protectAdmin } = require("../middlewares/auth");
const checkPermission = require("../middlewares/checkPermission");

router.get("/:roleId", protectAdmin, checkPermission("permission:assign"), rolePermissionController.getPermissionByRole);

router.route("/")
    .post(protectAdmin, checkPermission("permission:assign"), rolePermissionController.addPermissionToRole)
    .delete(protectAdmin, checkPermission("permission:revoke"), rolePermissionController.removePermissionFromRole);

module.exports = router;