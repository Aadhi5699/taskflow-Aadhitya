const db = require('../config/db');

class ProjectModel {
  static async findAllForUser(userId, limit = 10, offset = 0) {
    const text = `
      SELECT DISTINCT p.* 
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.owner_id = $1 OR t.assignee_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const { rows } = await db.query(text, [userId, limit, offset]);
    return rows;
  }

  static async countAllForUser(userId) {
    const text = `
      SELECT COUNT(DISTINCT p.id) 
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.owner_id = $1 OR t.assignee_id = $1
    `;
    const { rows } = await db.query(text, [userId]);
    return parseInt(rows[0].count);
  }

  static async findById(projectId) {
    const { rows } = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    return rows[0];
  }

  static async create(name, description, ownerId) {
    const text = 'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *';
    const { rows } = await db.query(text, [name, description, ownerId]);
    return rows[0];
  }

  static async update(projectId, name, description) {
    const text = `
      UPDATE projects 
      SET name = COALESCE($1, name), description = COALESCE($2, description)
      WHERE id = $3 RETURNING *
    `;
    const { rows } = await db.query(text, [name, description, projectId]);
    return rows[0];
  }

  static async delete(projectId) {
    await db.query('DELETE FROM projects WHERE id = $1', [projectId]);
  }
}

module.exports = ProjectModel;
