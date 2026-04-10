const db = require('../config/db');

class TaskModel {
  static async findByProjectId(projectId, filters = {}, limit = 50, offset = 0) {
    let text = 'SELECT * FROM tasks WHERE project_id = $1';
    const params = [projectId];
    
    if (filters.status) {
      params.push(filters.status);
      text += ` AND status = $${params.length}`;
    }
    
    if (filters.assignee) {
      params.push(filters.assignee);
      text += ` AND assignee_id = $${params.length}`;
    }
    
    text += ' ORDER BY created_at DESC';
    
    params.push(limit);
    text += ` LIMIT $${params.length}`;
    
    params.push(offset);
    text += ` OFFSET $${params.length}`;

    const { rows } = await db.query(text, params);
    return rows;
  }

  static async countByProjectId(projectId, filters = {}) {
    let text = 'SELECT COUNT(*) FROM tasks WHERE project_id = $1';
    const params = [projectId];
    
    if (filters.status) {
      params.push(filters.status);
      text += ` AND status = $${params.length}`;
    }
    
    if (filters.assignee) {
      params.push(filters.assignee);
      text += ` AND assignee_id = $${params.length}`;
    }
    
    const { rows } = await db.query(text, params);
    return parseInt(rows[0].count);
  }

  static async findById(taskId) {
    const { rows } = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    return rows[0];
  }

  static async create(title, description, status, priority, projectId, assigneeId, dueDate) {
    const text = `
      INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const params = [
      title,
      description || null,
      status || 'todo',
      priority || 'medium',
      projectId,
      assigneeId || null,
      dueDate || null
    ];
    const { rows } = await db.query(text, params);
    return rows[0];
  }

  static async update(taskId, updates) {
    const { title, description, status, priority, assigneeId, dueDate } = updates;
    
    let setClauses = [];
    let params = [];
    let i = 1;
    
    if (title !== undefined) { setClauses.push(`title = $${i++}`); params.push(title); }
    if (description !== undefined) { setClauses.push(`description = $${i++}`); params.push(description); }
    if (status !== undefined) { setClauses.push(`status = $${i++}`); params.push(status); }
    if (priority !== undefined) { setClauses.push(`priority = $${i++}`); params.push(priority); }
    if (assigneeId !== undefined) { setClauses.push(`assignee_id = $${i++}`); params.push(assigneeId); }
    if (dueDate !== undefined) { setClauses.push(`due_date = $${i++}`); params.push(dueDate); }
    
    if (setClauses.length === 0) {
      return this.findById(taskId);
    }
    
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(taskId);
    
    const query = `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`;
    const { rows } = await db.query(query, params);
    return rows[0];
  }

  static async delete(taskId) {
    await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);
  }
}

module.exports = TaskModel;
