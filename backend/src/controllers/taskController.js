const TaskModel = require('../models/taskModel');
const ProjectModel = require('../models/projectModel');

const getTasks = async (req, res, next) => {
  try {
    const { status, assignee } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const filters = { status, assignee };
    const tasks = await TaskModel.findByProjectId(req.params.id, filters, limit, offset);
    const totalCount = await TaskModel.countByProjectId(req.params.id, filters);

    res.json({ 
      tasks,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (err) { next(err); }
};

const createTask = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const project = await ProjectModel.findById(projectId);
    if (!project) return res.status(404).json({ error: 'not found' });

    const { title, description, priority, assignee_id, due_date } = req.body;
    
    if (!title) return res.status(400).json({ error: 'validation failed', fields: { title: 'is required' } });

    const task = await TaskModel.create(title, description, 'todo', priority, projectId, assignee_id, due_date);
    res.status(201).json(task);
  } catch (err) { next(err); }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await TaskModel.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'not found' });

    const { title, description, status, priority, assignee_id, due_date } = req.body;
    const updated = await TaskModel.update(task.id, { 
      title, 
      description, 
      status, 
      priority, 
      assigneeId: assignee_id, 
      dueDate: due_date 
    });
    
    res.json(updated);
  } catch (err) { next(err); }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await TaskModel.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'not found' });

    const project = await ProjectModel.findById(task.project_id);
    if (project.owner_id !== req.user.user_id) {
       return res.status(403).json({ error: 'forbidden' });
    }

    await TaskModel.delete(task.id);
    res.status(204).send();
  } catch (err) { next(err); }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
