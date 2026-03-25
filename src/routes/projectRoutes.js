const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController.js");
const verifyToken = require("../middlewares/verifyToken.js");
const {
  projectRules,
  memberRules,
} = require("../middlewares/projectsValidation.js");
const validate = require("../middlewares/validate.js");

//Create project route
router.post(
  "/projects",
  verifyToken,
  validate(projectRules),
  projectController.createProject,
);

//Get all project route
router.get("/projects", verifyToken, projectController.getAllProjects);

//Get pojects by id
router.get("/projects/:id", verifyToken, projectController.getProjectById);

//Update project
router.put(
  "/projects/:id",
  verifyToken,
  validate(projectRules),
  projectController.updateProject,
);

//Delete project
router.delete("/projects/:id", verifyToken, projectController.deleteProject);

//Add Member
router.post(
  "/projects/:id/members",
  verifyToken,
  validate(memberRules),
  projectController.addMember,
);

//Remove member
router.delete(
  "/projects/:id/members/:userId",
  verifyToken,
  projectController.removeMember,
);

module.exports = router;
