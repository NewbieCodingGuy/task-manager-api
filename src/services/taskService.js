const pool = require("../config/db.js");
const emailQueue = require("../queues/emailQueue.js");
const { getIO } = require("../socket/socket.service.js");

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
    error.statusCode = 403;
    throw error;
  }

  if (assignedTo) {
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
  }

  // Create Task
  const [task] = await pool.execute(
    "INSERT INTO tasks(title, description, project_id, assigned_to, status, priority, created_by) VALUES(?,?,?,?,?,?,?)",
    [
      title,
      description,
      projectId,
      assignedTo || null,
      status || "todo",
      priority || "medium",
      userId,
    ],
  );

  if (task.affectedRows === 0) {
    const error = new Error("Task creation Failed");
    error.statusCode = 500;
    throw error;
  }

  return {
    id: task.insertId,
    title,
    description,
    projectId,
    assignedTo: assignedTo || null,
    status: status || "todo",
    priority: priority || "medium",
    createdBy: userId,
  };
};

//GET TASKS + FILTERING
const getAllTasks = async (userId, projectId, filters = {}) => {
  //Check if user is member of the project
  const [user] = await pool.execute(
    "SELECT user_id FROM project_members WHERE user_id=? AND project_id=?",
    [userId, projectId],
  );

  if (user.length === 0) {
    const error = new Error("Only Project members can perform this action");
    error.statusCode = 403;
    throw error;
  }

  //Fetch all tasks later add filtering too
  let query = "SELECT * FROM tasks WHERE project_id=?";
  const params = [parseInt(projectId)];

  if (filters.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }

  if (filters.priority) {
    query += " AND priority = ?";
    params.push(filters.priority);
  }

  if (filters.assignee) {
    query += " AND assigned_to = ?";
    params.push(parseInt(filters.assignee));
  }

  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;
  const offset = (page - 1) * limit;

  query += " LIMIT ? OFFSET ?";
  params.push(limit, offset);

  // ✅ Build count query with same filters, without LIMIT/OFFSET
  let countQuery = "SELECT COUNT(*) as total FROM tasks WHERE project_id = ?";
  const countParams = [projectId];

  if (filters.status) {
    countQuery += " AND status = ?";
    countParams.push(filters.status);
  }

  if (filters.priority) {
    countQuery += " AND priority = ?";
    countParams.push(filters.priority);
  }

  if (filters.assignee) {
    countQuery += " AND assigned_to = ?";
    countParams.push(parseInt(filters.assignee));
  }

  const [countResult] = await pool.query(countQuery, countParams);
  const total = countResult[0].total;

  const [tasks] = await pool.query(query, params);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
    },
  };
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
    error.statusCode = 403;
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

  return task[0];
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
    error.statusCode = 403;
    throw error;
  }

  //Update task
  const [task] = await pool.execute(
    "UPDATE tasks SET title=?, description=?, status=?, priority=? WHERE id=? AND project_id=?",
    [title, description, status, priority, taskId, projectId],
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
  // Fetch the task to get created_by
  const [task] = await pool.execute(
    "SELECT created_by FROM tasks WHERE id = ? AND project_id = ?",
    [taskId, projectId],
  );

  if (task.length === 0) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  const isOwner = task[0].role === "owner";
  const isCreator = task[0].created_by === userId;

  if (!isOwner && !isCreator) {
    const error = new Error(
      "Only project owner or task creator can delete tasks",
    );
    error.statusCode = 403;
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

  const [task] = await pool.execute(
    "SELECT title FROM tasks WHERE id = ? AND project_id = ?",
    [taskId, projectId],
  );

  const [assigneeMail] = await pool.execute(
    "SELECT email FROM users WHERE id=?",
    [assignedTo],
  );

  const io = getIO();
  io.to(`user:${assignedTo}`).emit("notification", {
    type: "TASK_ASSIGNED",
    message: `You have been assigned a new task`,
    taskId,
    projectId,
    timeStamp: new Date().toISOString(),
  });

  await emailQueue.add(
    {
      to: assigneeMail[0].email,
      subject: "You have been assigned a task",
      html: `<h2>You have been assigned to task ${task[0].title} 
      in project ${projectId}. Log in to view details.</h2>`,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
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
