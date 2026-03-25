const pool = require("../config/db.js");

const createProject = async (userId, title, description) => {
  const [row] = await pool.execute(
    "INSERT INTO projects (owner_id, title, description) VALUES (?, ?, ?)",
    [userId, title, description],
  );

  if (!row.insertId) {
    const error = new Error("Project creation failed");
    error.statusCode = 500;
    throw error;
  }

  await pool.execute(
    "INSERT INTO project_members (user_id, project_id, role) VALUES (?, ?, ?)",
    [userId, row.insertId, "owner"],
  );

  return { id: row.insertId, userId, title, description };
};

const getAllProjects = async (userId) => {
  const [projects] = await pool.execute(
    `SELECT p.id, p.title, p.description, p.created_at
     FROM project_members pm
     JOIN projects p ON pm.project_id = p.id
     WHERE pm.user_id = ?`,
    [userId],
  );
  return projects;
};

const getProjectById = async (projectId, userId) => {
  const [membership] = await pool.execute(
    "SELECT role FROM project_members WHERE user_id = ? AND project_id = ?",
    [userId, projectId],
  );

  if (membership.length === 0) {
    const error = new Error("Project not found or access denied");
    error.statusCode = 403;
    throw error;
  }

  const [project] = await pool.execute(
    "SELECT id, title, description, owner_id, created_at FROM projects WHERE id = ?",
    [projectId],
  );

  if (project.length === 0) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  const [members] = await pool.execute(
    `SELECT u.id, u.name, pm.role
     FROM project_members pm
     JOIN users u ON pm.user_id = u.id
     WHERE pm.project_id = ?`,
    [projectId],
  );

  return { ...project[0], members };
};

const updateProject = async (projectId, userId, title, description) => {
  const [rows] = await pool.execute(
    "SELECT owner_id FROM projects WHERE id = ?",
    [projectId],
  );

  if (rows.length === 0) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  if (rows[0].owner_id !== userId) {
    const error = new Error("Only the project owner can perform this action");
    error.statusCode = 403;
    throw error;
  }

  await pool.execute(
    "UPDATE projects SET title = ?, description = ? WHERE id = ?",
    [title, description, projectId],
  );

  return { id: projectId, title, description };
};

const deleteProject = async (projectId, userId) => {
  const [rows] = await pool.execute(
    "SELECT owner_id FROM projects WHERE id = ?",
    [projectId],
  );

  if (rows.length === 0) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  if (rows[0].owner_id !== userId) {
    const error = new Error("Only the project owner can perform this action");
    error.statusCode = 403;
    throw error;
  }

  await pool.execute("DELETE FROM projects WHERE id = ?", [projectId]);
};

const addMember = async (projectId, requestingUserId, targetUserId, role) => {
  const [project] = await pool.execute(
    "SELECT owner_id FROM projects WHERE id = ?",
    [projectId],
  );

  if (project.length === 0) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  if (project[0].owner_id !== requestingUserId) {
    const error = new Error("Only the project owner can perform this action");
    error.statusCode = 403;
    throw error;
  }

  const [targetUser] = await pool.execute("SELECT id FROM users WHERE id = ?", [
    targetUserId,
  ]);

  if (targetUser.length === 0) {
    const error = new Error("Target user does not exist");
    error.statusCode = 404;
    throw error;
  }

  const [existing] = await pool.execute(
    "SELECT role FROM project_members WHERE user_id = ? AND project_id = ?",
    [targetUserId, projectId],
  );

  if (existing.length > 0) {
    const error = new Error("User is already a member of this project");
    error.statusCode = 409;
    throw error;
  }

  await pool.execute(
    "INSERT INTO project_members (user_id, project_id, role) VALUES (?, ?, ?)",
    [targetUserId, projectId, role || "member"],
  );

  return { projectId, userId: targetUserId, role: role || "member" };
};

const removeMember = async (projectId, requestingUserId, targetUserId) => {
  const [project] = await pool.execute(
    "SELECT owner_id FROM projects WHERE id = ?",
    [projectId],
  );

  if (project.length === 0) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  if (project[0].owner_id !== requestingUserId) {
    const error = new Error("Only the project owner can perform this action");
    error.statusCode = 403;
    throw error;
  }

  if (requestingUserId === targetUserId) {
    const error = new Error("Owner cannot remove themselves from the project");
    error.statusCode = 403;
    throw error;
  }

  const [result] = await pool.execute(
    "DELETE FROM project_members WHERE user_id = ? AND project_id = ?",
    [targetUserId, projectId],
  );

  if (result.affectedRows === 0) {
    const error = new Error("Member not found in this project");
    error.statusCode = 404;
    throw error;
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
