const { body } = require("express-validator");

const projectRules = [
  body("title")
    .notEmpty()
    .isLength({ min: 1 })
    .withMessage("Minimum 1 character required"),

  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 1 })
    .withMessage("Minimum 1 character required"),
];

const memberRules = [
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["owner", "member", "viewer"])
    .withMessage("Role must be one of: owner, member, viewer"),
];

module.exports = { projectRules, memberRules };
