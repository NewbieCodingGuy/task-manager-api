const { body } = require("express-validator");

const taskRules = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 1 })
    .withMessage("Minimum 1 character required"),

  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 1 })
    .withMessage("Minimum 1 character required"),
];

module.exports = { taskRules };
