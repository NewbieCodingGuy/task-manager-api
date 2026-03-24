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
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        error: err.message,
      });
    }

    console.error("Register error : ", err.message);

    return res.status(500).json({
      error: "Internal server error",
    });
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
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        error: err.message,
      });
    }

    console.error("Login error : ", err.message);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

module.exports = { register, login };
