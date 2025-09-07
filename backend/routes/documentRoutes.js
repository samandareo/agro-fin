const router = require("express").Router();
const documentController = require("../controllers/documentController");
const { protectUserOrAdmin, protectUser, protectAdmin } = require("../middlewares/auth");
const checkPermission = require("../middlewares/checkPermission");
const upload = require("../utils/multerConfig");

router.get("/uploaded/group", protectUser, checkPermission("document:read"), documentController.getAllUploadedDocumentsByGroup);

router.get("/uploaded/:uploaderId", protectAdmin, checkPermission("document:read"), documentController.getAllUploadedDocuments);

router.get("/user/filter", protectUser, checkPermission("document:read"), documentController.getUserFilteredDocuments);
router.get("/user/filter-options", protectUser, checkPermission("document:read"), documentController.getUserFilterOptions);

router.get("/admin/filter", protectAdmin, checkPermission("document:read"), documentController.getFilteredDocuments);
router.get("/admin/filter-options", protectAdmin, checkPermission("document:read"), documentController.getFilterOptions);

router.get("/", protectUserOrAdmin, checkPermission("document:read"), documentController.getAllDocuments);
router.post("/", protectUserOrAdmin, checkPermission("document:create"), upload.single("file"), documentController.createDocument);
router.get("/:documentId", protectUserOrAdmin, checkPermission("document:read"), documentController.getDocument);
router.put("/:documentId", protectUserOrAdmin, checkPermission("document:update"), upload.single("file"), documentController.updateDocument);
router.delete("/:documentId", protectUserOrAdmin, checkPermission("document:delete"), documentController.deleteDocument);

router.get("/:documentId/download", protectUserOrAdmin, checkPermission("document:download"), documentController.downloadDocument);
router.get("/:documentId/info", protectUserOrAdmin, checkPermission("document:read"), documentController.getDocumentInfo);

module.exports = router;