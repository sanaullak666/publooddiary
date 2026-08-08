const { db } = require('../config/database');

const AdminModel = {
  async findByUsername(username) {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    return rows.length > 0 ? rows[0] : null;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT id, username, email, name, role, created_at FROM admins WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  async create(adminData) {
    const { username, password, email, name, role } = adminData;
    const [result] = await db.query(
      'INSERT INTO admins (username, password, email, name, role) VALUES (?, ?, ?, ?, ?)',
      [username, password, email, name, role || 'administrator']
    );
    return result.insertId;
  },

  async updatePassword(id, hashedPassword) {
    const [result] = await db.query(
      'UPDATE admins SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = AdminModel;
