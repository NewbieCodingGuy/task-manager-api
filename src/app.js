const db = require("./config/db");
const express = require("express");
const authRoutes = require("./routes/authRoutes.js");
const projectRoutes = require("./routes/projectRoutes.js");
const taskRoutes = require("./routes/taskRoutes.js");
const errorHandler = require("./middlewares/errorHandler.js");
const requestLogger = require("./middlewares/requestLogger.js");
const app = express();
app.use(express.json());
app.use(requestLogger);

//HeathCheck
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", projectRoutes);
app.use("/api", taskRoutes);
app.use(errorHandler);

module.exports = app;
