const { db } = require('../config/database');

const LogModel = {
  async addLog(adminUsername, action, details = '', ipAddress = '') {
    try {
      const sql = 'INSERT INTO activity_logs (admin_username, action, details, ip_address) VALUES (?, ?, ?, ?)';
      await db.query(sql, [adminUsername, action, details, ipAddress]);
    } catch (err) {
      console.error('[LogModel] Failed to insert activity log:', err);
    }
  },

  async getLogs(options = {}) {
    const { search, page = 1, limit = 15 } = options;
    let whereConditions = [];
    let params = [];

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      whereConditions.push('(admin_username LIKE ? OR action LIKE ? OR details LIKE ?)');
      params.push(term, term, term);
    }

    const whereSql = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const countSql = `SELECT COUNT(*) as total FROM activity_logs ${whereSql}`;
    const [countRows] = await db.query(countSql, params);
    const totalCount = countRows[0].total || countRows[0]['COUNT(*)'] || 0;

    const safeLimit = Math.max(1, parseInt(limit, 10) || 15);
    const offset = Math.max(0, (parseInt(page, 10) - 1) * safeLimit);

    const dataSql = `
      SELECT * FROM activity_logs
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ${safeLimit} OFFSET ${offset}
    `;

    const [rows] = await db.query(dataSql, params);

    return {
      logs: rows,
      totalCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / safeLimit) || 1
    };
  }
};

module.exports = LogModel;
