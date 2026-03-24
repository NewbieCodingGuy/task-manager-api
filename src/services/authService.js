const pool = require("../config/db.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const registerUser = async ({ name, email, password }) => {
  const [existing] = await pool.execute("SELECT id FROM users WHERE email=?", [
    email,
  ]);

  if (existing.length > 0) {
    const error = new Error("User already exist!");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [row] = await pool.execute(
    "INSERT INTO users(name, email, password) VALUES(?,?,?)",
    [name, email, hashedPassword],
  );

  return {
    id: row.insertId,
    name,
    email,
  };
};

const loginUser = async ({ email, password }) => {
  const [row] = await pool.execute(
    "SELECT id,email,password FROM users WHERE email=?",
    [email],
  );

  if (row.length === 0) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const hashedPassword = row[0].password;

  const isMatch = await bcrypt.compare(password, hashedPassword);

  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const user = row[0];

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
  );

  return { token };
};

module.exports = { registerUser, loginUser };
