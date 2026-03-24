const express = require("express");
const authController = require("../controllers/authController.js");
const {
  registerRules,
  loginRules,
} = require("../middlewares/authValidation.js");
const validate = require("../middlewares/validate.js");
const router = express.Router();

router.post("/register", validate(registerRules), authController.register);
router.post("/login", validate(loginRules), authController.login);

module.exports = router;
