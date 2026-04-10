const ProjectModel = require('../models/projectModel');
const TaskModel = require('../models/taskModel');

const getProjects = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const projects = await ProjectModel.findAllForUser(req.user.user_id, limit, offset);
    const totalCount = await ProjectModel.countAllForUser(req.user.user_id);

    res.json({ 
      projects,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (err) { next(err); }
};

const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'validation failed', fields: { name: 'is required' } });
    
    const project = await ProjectModel.create(name, description, req.user.user_id);
    res.status(201).json(project);
  } catch (err) { next(err); }
};

const getProjectDetails = async (req, res, next) => {
  try {
    const project = await ProjectModel.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    
    const tasks = await TaskModel.findByProjectId(project.id);
    
    // Check access constraint: Owner or Assignee in any task
    const isOwner = project.owner_id === req.user.user_id;
    const isAssignee = tasks.some(t => t.assignee_id === req.user.user_id);
    
    if (!isOwner && !isAssignee) {
      return res.status(403).json({ error: 'forbidden' });
    }

    res.json({ ...project, tasks });
  } catch (err) { next(err); }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await ProjectModel.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    if (project.owner_id !== req.user.user_id) return res.status(403).json({ error: 'forbidden' });

    const { name, description } = req.body;
    const updated = await ProjectModel.update(project.id, name, description);
    res.json(updated);
  } catch (err) { next(err); }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await ProjectModel.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    if (project.owner_id !== req.user.user_id) return res.status(403).json({ error: 'forbidden' });

    await ProjectModel.delete(project.id);
    res.status(204).send();
  } catch (err) { next(err); }
};

module.exports = { getProjects, createProject, getProjectDetails, updateProject, deleteProject };
