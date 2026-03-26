const pool = require("../config/db.js");

//CREATE TASKS
const createTask = async (
  userId,
  projectId,
  title,
  description,
  assignedTo,
  status,
  priority,
) => {
  //Check if user is a member of the project
  const [user] = await pool.execute(
    "SELECT user_id FROM project_members WHERE user_id=? AND project_id=?",
    [userId, projectId],
  );

  if (user.length === 0) {
    const error = new Error("Only Project members can perform this action");
    error.statusCode = 404;
    throw error;
  }

  //Check if assigned to is a member of the project
  const [assignee] = await pool.execute(
    "SELECT user_id FROM project_members WHERE user_id=? AND project_id=?",
    [assignedTo, projectId],
  );

  if (assignee.length === 0) {
    const error = new Error("Assignee is not a member of this project");
    error.statusCode = 403;
    throw error;
  }

  // Create Task
  const [task] = await pool.execute(
    "INSERT INTO project_members(title, description, project_id, assigned_to, status, priority) VALUES(?,?,?)",
    [
      title,
      description,
      projectId,
      assignedTo,
      status || "todo",
      priority || "low",
    ],
  );

  if (task.affectedRows !== 0) {
    const error = new Error("Task creation Failed");
    error.statusCode = 404;
    throw error;
  }

  return {
    id: task.insertId,
    title,
    description,
    projectId,
    assignedTo,
    status,
    priority,
  };
};

//GET TASKS + FILTERING
const getAllTasks = async (userId, projectId) => {
  //Check if user is member of the project
  const [user] = await pool.execute(
    "SELECT user_id FROM project_members WHERE user_id=? AND project_id=?",
    [userId, projectId],
  );

  if (user.length === 0) {
    const error = new Error("Only Project members can perform this action");
    error.statusCode = 404;
    throw error;
  }

  //Fetch all tasks later add filtering too
  const [tasks] = await pool.execute("SELECT * FROM tasks WHERE project_id=?", [
    projectId,
  ]);

  return tasks;
};

//GET TASK BY TASK-ID
const getTaskById = async (userId, projectId, taskId) => {
  //Check user is a member of the project
  const [user] = await pool.execute(
    "SELECT user_id FROM project_members WHERE user_id=? AND project_id=?",
    [userId, projectId],
  );

  if (user.length === 0) {
    const error = new Error("Only Project members can perform this action");
    error.statusCode = 404;
    throw error;
  }

  // Fetch the task
  const [task] = await pool.execute(
    "SELECT * FROM tasks WHERE id=? AND project_id=?",
    [taskId, projectId],
  );

  if (task.length === 0) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  return task;
};

//UPDATE TASK
const updateTask = async (
  userId,
  projectId,
  taskId,
  title,
  description,
  status,
  priority,
) => {
  //Check user is a member of the project
  const [user] = await pool.execute(
    "SELECT user_id FROM project_members WHERE user_id=? AND project_id=?",
    [userId, projectId],
  );

  if (user.length === 0) {
    const error = new Error("Only Project members can perform this action");
    error.statusCode = 404;
    throw error;
  }

  //Update task
  const [task] = await pool.execute(
    "UPDATE tasks SET title=?, description=?, status=?, priority=?",
    [title, description, status, priority],
  );

  return {
    id: taskId,
    title,
    description,
    status,
    priority,
  };
};

//DELETE TASK
const deleteTask = async (userId, projectId, taskId) => {
  //Check user is task creator or project owner
  const [user] = await pool.execute(
    "SELECT role FROM project_members WHERE user_id=? AND project_id=?",
    [userId, projectId],
  );

  if (user.length === 0 || user.role !== "owner") {
    const error = new Error("Only Project members can perform this action");
    error.statusCode = 404;
    throw error;
  }

  //Delete the task
  await pool.execute("DELETE FROM tasks WHERE id=? AND project_id=?", [
    taskId,
    projectId,
  ]);
};

//Assign task to a member
const assignTask = async (userId, projectId, taskId, assignedTo) => {
  //Check user is a member of the project
  const [user] = await pool.execute(
    "SELECT user_id FROM project_members WHERE user_id=? AND project_id=?",
    [userId, projectId],
  );

  if (user.length === 0) {
    const error = new Error("Only Project members can perform this action");
    error.statusCode = 404;
    throw error;
  }

  //Check assignedTo is member of the project
  const [assignee] = await pool.execute(
    "SELECT user_id FROM project_members WHERE user_id=? AND project_id=?",
    [assignedTo, projectId],
  );

  if (assignee.length === 0) {
    const error = new Error("Assignee is not a member of this project");
    error.statusCode = 403;
    throw error;
  }

  const [member] = await pool.execute(
    "UPDATE tasks SET assigned_to=? WHERE id=? AND project_id=?",
    [assignedTo, taskId, projectId],
  );

  return {
    id: taskId,
    projectId,
    assignedTo,
  };
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignTask,
};
