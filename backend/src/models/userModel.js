const db = require('../config/db');

class UserModel {
  static async findAll() {
    const { rows } = await db.query('SELECT id, name, email FROM users ORDER BY name ASC');
    return rows;
  }

  static async findByEmail(email) {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
  }

  static async create(name, email, passwordHash) {
    const { rows } = await db.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, passwordHash]
    );
    return rows[0];
  }
  
  static async findById(id) {
    const { rows } = await db.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [id]);
    return rows[0];
  }
}

module.exports = UserModel;
