const TaskModel = require('../models/taskModel');
const ProjectModel = require('../models/projectModel');
const UserModel = require('../models/userModel');

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

const predictTaskStuck = async (req, res, next) => {
  try {
    const task = await TaskModel.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'not found' });

    let assigneeName = 'Unassigned';
    let activeTasksCount = 0;
    if (task.assignee_id) {
      const user = await UserModel.findById(task.assignee_id);
      if (user) assigneeName = user.name;
      activeTasksCount = await TaskModel.countActiveForUser(task.assignee_id);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    const updatedDate = new Date(task.updated_at);
    const now = new Date();
    const daysElapsed = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));

    const prompt = `
Analyze if this project management task is currently stuck or blocked.
Task Details:
- Title: "${task.title}"
- Description: "${task.description || 'No description provided'}"
- Priority: "${task.priority}"
- Status: "${task.status}"
- Days in current status: ${daysElapsed} days
- Assignee: "${assigneeName}"
- Assignee's Workload: ${activeTasksCount} active tasks (todo or in_progress) currently assigned to this user.

Evaluate the metadata and workload. Determine if this task is likely stuck or blocked.
You must respond strictly in JSON format matching this schema:
{
  "isStuck": boolean,
  "confidenceScore": number (0 to 100),
  "blockerReason": "Detailed explanation of the bottleneck or what is holding it up"
}
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({ error: 'Gemini API returned an error', details: errorText });
    }

    const data = await response.json();
    const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      return res.status(502).json({ error: 'Invalid response from Gemini API' });
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(textResponse.trim());
    } catch (e) {
      return res.status(502).json({ error: 'Failed to parse Gemini response as JSON', responseText: textResponse });
    }

    res.json(parsedResult);
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, predictTaskStuck };
