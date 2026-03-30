const authService = require("../services/authService.js");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await authService.registerUser({ name, email, password });

    return res.status(201).json({
      message: "Account created successfully",
      user,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await authService.loginUser({ email, password });

    return res.status(200).json({
      message: "User logged in successfully",
      token,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
