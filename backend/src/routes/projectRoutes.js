const express = require('express');
const { getProjects, createProject, getProjectDetails, updateProject, deleteProject } = require('../controllers/projectController');
const { getTasks, createTask } = require('../controllers/taskController');

const router = express.Router();

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProjectDetails);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

// Nested task endpoints natively mapped to project ID in the path
router.get('/:id/tasks', getTasks);
router.post('/:id/tasks', createTask);

module.exports = router;
