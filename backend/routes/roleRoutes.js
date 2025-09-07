const router = require("express").Router();
const roleController = require("../controllers/roleController");
const { protectAdmin } = require("../middlewares/auth");
const checkPermission = require("../middlewares/checkPermission");

router.route("/")
    .get(protectAdmin, checkPermission("role:read"), roleController.getAllRoles)
    .post(protectAdmin, checkPermission("role:create"), roleController.createRole);

router.route("/:roleId")
    .get(protectAdmin, checkPermission("role:read"), roleController.getRole)
    .put(protectAdmin, checkPermission("role:update"), roleController.updateRole)
    .delete(protectAdmin, checkPermission("role:delete"), roleController.deleteRole);

module.exports = router;