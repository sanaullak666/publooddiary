const { db } = require('../config/database');
const DonorModel = require('./donorModel');
const LogModel = require('./logModel');

const PendingUpdateModel = {
  async createPendingUpdate(data) {
    const { donor_id, register_number, donor_name, current_date, requested_date } = data;
    const sql = `
      INSERT INTO pending_donation_updates (donor_id, register_number, donor_name, current_date, requested_date, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `;
    const [result] = await db.query(sql, [donor_id, register_number, donor_name, current_date, requested_date]);
    return result.insertId || result.lastID;
  },

  async getPendingUpdates() {
    const sql = `
      SELECT * FROM pending_donation_updates
      WHERE status = 'pending'
      ORDER BY requested_at DESC
    `;
    const [rows] = await db.query(sql);
    return rows || [];
  },

  async approvePendingUpdate(id, adminUsername, clientIp = '') {
    const [rows] = await db.query('SELECT * FROM pending_donation_updates WHERE id = ? AND status = "pending"', [id]);
    if (!rows || rows.length === 0) return false;

    const reqRecord = rows[0];
    const { register_number, requested_date, donor_name } = reqRecord;

    // Apply updated date to donor record
    await DonorModel.updateLastDonationDate(register_number, requested_date);

    // Update pending record status
    const updateSql = `
      UPDATE pending_donation_updates
      SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?
      WHERE id = ?
    `;
    await db.query(updateSql, [adminUsername, id]);

    // Log action
    await LogModel.addLog(
      adminUsername,
      'Approved Donation Update',
      `Approved donation date update for ${donor_name} (Reg: ${register_number}) to ${requested_date}`,
      clientIp
    );

    return true;
  },

  async rejectPendingUpdate(id, adminUsername, clientIp = '') {
    const [rows] = await db.query('SELECT * FROM pending_donation_updates WHERE id = ? AND status = "pending"', [id]);
    if (!rows || rows.length === 0) return false;

    const reqRecord = rows[0];
    const { register_number, donor_name } = reqRecord;

    const updateSql = `
      UPDATE pending_donation_updates
      SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?
      WHERE id = ?
    `;
    await db.query(updateSql, [adminUsername, id]);

    // Log action
    await LogModel.addLog(
      adminUsername,
      'Rejected Donation Update',
      `Rejected pending donation date update for ${donor_name} (Reg: ${register_number})`,
      clientIp
    );

    return true;
  }
};

module.exports = PendingUpdateModel;
