const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController.js");

const verifyToken = require("../middlewares/verifyToken.js");

const { taskRules } = require("../middlewares/taskValidation.js");

const validate = require("../middlewares/validate.js");

//Create task route
router.post(
  "/projects/:projectId/tasks",
  verifyToken,
  validate(taskRules),
  taskController.createTask,
);

//Get all tasks
router.get("/projects/:projectId/tasks", verifyToken, taskController.getTasks);

//Get task by id
router.get(
  "/projects/:projectId/tasks/:taskId",
  verifyToken,
  taskController.getTaskById,
);

//Update task by taskId
router.put(
  "/projects/:projectId/tasks/:taskId",
  verifyToken,
  taskController.updateTask,
);

//Delete task by taskId
router.delete(
  "/projects/:projectId/tasks/:taskId",
  verifyToken,
  taskController.deleteTask,
);

//Assign member by taskId
router.patch(
  "/projects/:projectId/tasks/:taskId/assign",
  verifyToken,
  taskController.assignTask,
);

module.exports = router;
