const pool = require("../config/db.js");

//CREATE PROJECT
const createProject = async ({ userId, title, description }) => {
  const [row] = await pool.execute(
    "INSERT INTO project(owner_id, title, description) VALUES (?,?,?)",
    [userId, title, description],
  );

  if (!row.insertId) {
    const error = new Error("Project creation failed");
    error.statusCode = 500;
    throw error;
  }
  const role = "owner";

  const [owner] = await pool.execute(
    "INSERT INTO project_members(user_id, project_id, role) VALUES (?,?,?)",
    [userId, row.insertId, role],
  );

  if (!owner.insertId) {
    const error = new Error("Owner allocation failed");
    error.statusCode = 500;
    throw error;
  }

  return row[0];
};

//GET ALL PROJECTS
const getAllProjects = async ({ userId }) => {
  const [projects] = await pool.execute(
    "SELECT p.id, p.title, p.description FROM project_members pm JOIN projects p ON pm.project_id = p.id WHERE pm.user_id=?",
    [userId],
  );

  if (projects.length === 0) {
    const error = new Error("Project fetching failed");
    error.statusCode = 500;
    throw error;
  }

  return rows.map((row) => ({
    id: row.project_id,
    title: row.title,
    description: row.description,
  }));
};

//GET PROJECT BY ID
const getProjectById = async ({ projectId, userId }) => {
  //verify user is a member
  const [row] = await pool.execute(
    "SELECT role FROM project_members WHERE user_id =? AND project_id=?",
    [userId, projectId],
  );

  const member = "member";

  const isMember = row[0].role === member;

  if (!isMember) {
    const error = new Error("User is not a member of this project");
    error.statusCode = 403;
    throw error;
  }

  // return project with members list
  const [members] = await pool.execute(
    "SELECT u.id, u.name FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id=?",
    [projectId],
  );

  return members.map((members) => ({
    id: members.id,
    name: members.name,
  }));
};

//UPDATE PROJECT
const updateProject = async ({ projectId, userId, title, description }) => {
  // verify user is owner
  const [rows] = await pool.execute(
    "SELECT owner_id FROM projects WHERE id =?",
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

  const [updatedRow] = await pool.execute(
    "UPDATE projects SET title=?, description=? WHERE project_id=?",
    [title, description, projectId],
  );

  if (updatedRow.affectedRows === 0) {
    const error = new Error("Project Updation Failed");
    error.statusCode = 500;
    throw error;
  }

  return updatedRow[0];
};

//DELETE PROJECT
const deleteProject = async ({ projectId, userId }) => {
  // verify user is owner
  const [rows] = await pool.execute(
    "SELECT owner_id FROM projects WHERE id =?",
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

  const [delProj] = await pool.execute(
    "DELETE FROM projects WHERE projectId=?",
    [projectId],
  );

  if (delProj.affectedRows === 0) {
    const error = new Error("Project deletion failed");
    error.statusCode = 500;
    throw error;
  }

  return delProj[0];
};

//ADD MEMBER
const addMember = async ({
  projectId,
  requestingUserId,
  targetUserId,
  role,
}) => {
  //   → verify requesting user is owner
  //   → verify target user exists
  //   → verify target user not already a member
  //   → insert into project_members
};
