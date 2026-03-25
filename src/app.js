const db = require("./config/db");
const express = require("express");
const authRoutes = require("./routes/authRoutes.js");
const projectRoutes = require("./routes/projectRoutes.js");
const app = express();
app.use(express.json());

//HeathCheck
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", projectRoutes);

module.exports = app;
