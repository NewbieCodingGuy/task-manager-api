const { validationResult } = require("express-validator");

const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      await validation.run(req);
    }

    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    return res.status(422).json({
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  };
};

module.exports = validate;
