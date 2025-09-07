const router = require("express").Router();
const userController = require("../controllers/userController");
const { protectUser } = require("../middlewares/auth");

router.post("/login", userController.login);
router.post("/refresh", userController.refreshToken);

module.exports = router;