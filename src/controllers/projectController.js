const projectService = require("../services/projectService.js");

const createProject = async (req, res) => {
  try {
    const { title, description } = req.body;
    const { userId } = req.user;
    const project = await projectService.createProject(
      userId,
      title,
      description,
    );

    return res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (err) {
    next(err);
  }
};

const getAllProjects = async (req, res) => {
  try {
    const { userId } = req.user;
    const allProjects = await projectService.getAllProjects(userId);

    return res.status(200).json({
      message: "All projects fetched",
      allProjects,
    });
  } catch (err) {
    next(err);
  }
};

const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { userId } = req.user;
    const project = await projectService.getProjectById(projectId, userId);

    return res.status(200).json({
      message: "Project fetched successfully",
      project,
    });
  } catch (err) {
    next(err);
  }
};

const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { userId } = req.user;
    const { title, description } = req.body;

    const project = await projectService.updateProject(
      projectId,
      userId,
      title,
      description,
    );

    return res.status(200).json({
      message: "Project Updated successfully",
      project,
    });
  } catch (err) {
    next(err);
  }
};

const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { userId } = req.user;

    const project = await projectService.deleteProject(projectId, userId);

    return res.status(200).json({
      message: "Project Deleted successfully",
      project,
    });
  } catch (err) {
    next(err);
  }
};

const addMember = async (req, res) => {
  try {
    const projectId = req.params.id;
    const requestingUserId = req.user.userId;
    const { targetUserId, role } = req.body;

    const member = await projectService.addMember(
      projectId,
      requestingUserId,
      targetUserId,
      role,
    );

    return res.status(201).json({
      message: "Member added succesfully",
      member,
    });
  } catch (err) {
    next(err);
  }
};

const removeMember = async (req, res) => {
  try {
    const projectId = req.params.id;
    const requestingUserId = req.user.userId;
    const targetUserId = req.params.userId;

    const member = await projectService.removeMember(
      projectId,
      requestingUserId,
      targetUserId,
    );

    return res.status(200).json({
      message: "Member removed successfully",
      member,
    });
  } catch (err) {
    next(err);
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
