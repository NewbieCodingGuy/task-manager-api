const taskService = require("../services/taskService.js");

const createTask = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const projectId = parseInt(req.params.projectId);
    const { title, description, assignedTo, status, priority } = req.body;

    const task = await taskService.createTask(
      userId,
      projectId,
      title,
      description,
      assignedTo,
      status,
      priority,
    );

    return res.status(201).json({
      message: "Tasks created successfully",
      task,
    });
  } catch (err) {
    next(err);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const projectId = parseInt(req.params.projectId);
    const { status, priority, assignee, page, limit } = req.query;

    const result = await taskService.getAllTasks(userId, projectId, {
      status,
      priority,
      assignee,
      page,
      limit,
    });

    return res.status(200).json({
      message: "Tasks fetched successfully",
      tasks: result.tasks,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const projectId = parseInt(req.params.projectId);
    const taskId = parseInt(req.params.taskId);

    const task = await taskService.getTaskById(userId, projectId, taskId);

    return res.status(200).json({
      message: "Task fetched successfully",
      task,
    });
  } catch (err) {
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const projectId = parseInt(req.params.projectId);
    const taskId = parseInt(req.params.taskId);
    const { title, description, status, priority } = req.body;

    const updatedTask = await taskService.updateTask(
      userId,
      projectId,
      taskId,
      title,
      description,
      status,
      priority,
    );

    return res.status(200).json({
      message: "Task updated successfully",
      updatedTask,
    });
  } catch (err) {
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const projectId = parseInt(req.params.projectId);
    const taskId = parseInt(req.params.taskId);

    const task = await taskService.deleteTask(userId, projectId, taskId);

    return res.status(200).json({
      message: "Task deleted successfully",
      task,
    });
  } catch (err) {
    next(err);
  }
};

const assignTask = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const projectId = parseInt(req.params.projectId);
    const taskId = parseInt(req.params.taskId);
    const { assignedTo } = req.body;

    const task = await taskService.assignTask(
      userId,
      projectId,
      taskId,
      assignedTo,
    );

    return res.status(200).json({
      message: "Task assigned successfully",
      task,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignTask,
};
