const router = require("express").Router();
const deleteRequestController = require("../controllers/deleteRequestController");
const { protectUser, protectAdmin, protectUserOrAdmin } = require("../middlewares/auth");
const checkPermission = require("../middlewares/checkPermission");

router.route("/")
    .get(protectUserOrAdmin, deleteRequestController.getAllDeleteRequests)
    .post(protectUser, checkPermission("delete-request:create"), deleteRequestController.createDeleteRequest);

router.route("/:deleteRequestId")
    .get(protectUserOrAdmin, deleteRequestController.getDeleteRequest) 
    .put(protectAdmin, checkPermission("delete-request:approve"), deleteRequestController.updateDeleteRequest);

router.route("/status/:status")
    .get(protectUserOrAdmin, deleteRequestController.getAllDeleteRequestsByStatus);

router.get("/user/requests", protectUser, deleteRequestController.getUserDeleteRequests);
router.post("/user/:documentId", protectUser, checkPermission("delete-request:create"), deleteRequestController.createUserDeleteRequest);

router.get("/admin/pending-count", protectAdmin, deleteRequestController.getPendingDeleteRequestsCount);

module.exports = router;