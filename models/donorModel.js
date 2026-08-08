const { db } = require('../config/database');

function toBoolInt(val) {
  if (val === true || val === 1 || val === '1' || val === 'true') return 1;
  return 0;
}

function parseLanguagesJson(languages) {
  if (Array.isArray(languages)) {
    return JSON.stringify(languages);
  }
  if (typeof languages === 'string') {
    try {
      const parsed = JSON.parse(languages);
      if (Array.isArray(parsed)) return JSON.stringify(parsed);
    } catch (e) {
      const splitArr = languages.split(',').map(s => s.trim()).filter(Boolean);
      return JSON.stringify(splitArr.length > 0 ? splitArr : [languages]);
    }
  }
  return JSON.stringify([]);
}

const DonorModel = {
  async checkDuplicates(registerNumber, email, excludeId = null) {
    const regStr = registerNumber ? String(registerNumber).trim() : '';
    const emailStr = email ? String(email).trim() : '';

    if (regStr) {
      let sqlReg = 'SELECT id FROM donors WHERE LOWER(register_number) = LOWER(?)';
      let paramsReg = [regStr];
      if (excludeId) {
        sqlReg += ' AND id != ?';
        paramsReg.push(excludeId);
      }
      const [rowsReg] = await db.query(sqlReg, paramsReg);
      if (rowsReg && rowsReg.length > 0) return { duplicate: true, field: 'register_number' };
    }

    if (emailStr) {
      let sqlEmail = 'SELECT id FROM donors WHERE LOWER(email) = LOWER(?)';
      let paramsEmail = [emailStr];
      if (excludeId) {
        sqlEmail += ' AND id != ?';
        paramsEmail.push(excludeId);
      }
      const [rowsEmail] = await db.query(sqlEmail, paramsEmail);
      if (rowsEmail && rowsEmail.length > 0) return { duplicate: true, field: 'email' };
    }

    return { duplicate: false };
  },

  async create(donorData) {
    const {
      name,
      blood_group,
      last_donated_date,
      department,
      register_number,
      contact_number,
      alt_contact_number,
      email,
      state_ut,
      languages,
      has_health_problem,
      health_problem_details,
      has_regular_medicine,
      medicine_details,
      consumes_alcohol_substance,
      declaration_agreed
    } = donorData;

    const languagesJson = parseLanguagesJson(languages);
    const healthProblemBool = toBoolInt(has_health_problem);
    const regularMedicineBool = toBoolInt(has_regular_medicine);
    const alcoholSubstanceBool = toBoolInt(consumes_alcohol_substance);
    const declarationBool = toBoolInt(declaration_agreed);

    const sql = `
      INSERT INTO donors (
        name, blood_group, last_donated_date, department, register_number,
        contact_number, alt_contact_number, email, state_ut, languages,
        has_health_problem, health_problem_details, has_regular_medicine,
        medicine_details, consumes_alcohol_substance, declaration_agreed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      String(name).trim(),
      String(blood_group).trim(),
      last_donated_date ? String(last_donated_date).trim() : null,
      String(department).trim(),
      String(register_number).trim(),
      String(contact_number).trim(),
      alt_contact_number ? String(alt_contact_number).trim() : null,
      String(email).trim(),
      String(state_ut).trim(),
      languagesJson,
      healthProblemBool,
      healthProblemBool === 1 && health_problem_details ? String(health_problem_details).trim() : null,
      regularMedicineBool,
      regularMedicineBool === 1 && medicine_details ? String(medicine_details).trim() : null,
      alcoholSubstanceBool,
      declarationBool
    ];

    const [result] = await db.query(sql, params);
    return result.insertId;
  },

  async findByRegisterNumberOrEmail(identifier) {
    const term = identifier.trim();
    const sql = `
      SELECT id, name, blood_group, department, register_number, email, last_donated_date
      FROM donors
      WHERE LOWER(register_number) = LOWER(?) OR LOWER(email) = LOWER(?)
    `;
    const [rows] = await db.query(sql, [term, term]);
    return rows.length > 0 ? rows[0] : null;
  },

  async updateLastDonationDate(identifier, newDate) {
    const term = identifier.trim();
    const sql = `
      UPDATE donors
      SET last_donated_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE LOWER(register_number) = LOWER(?) OR LOWER(email) = LOWER(?)
    `;
    const [result] = await db.query(sql, [newDate, term, term]);
    return result.affectedRows > 0;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM donors WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const donor = rows[0];
    try {
      donor.languages = JSON.parse(donor.languages);
    } catch (e) {
      if (typeof donor.languages === 'string') {
        donor.languages = donor.languages.split(',').map(s => s.trim());
      }
    }
    return donor;
  },

  async findAll(options = {}) {
    const {
      search,
      blood_group,
      department,
      state_ut,
      language,
      last_donated_start,
      last_donated_end,
      has_health_problem,
      has_regular_medicine,
      consumes_alcohol_substance,
      sort_by = 'created_at',
      sort_order = 'DESC',
      page = 1,
      limit = 10
    } = options;

    let whereConditions = [];
    let params = [];

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      whereConditions.push(`(
        name LIKE ? OR
        register_number LIKE ? OR
        email LIKE ? OR
        contact_number LIKE ? OR
        blood_group LIKE ? OR
        department LIKE ? OR
        state_ut LIKE ? OR
        languages LIKE ?
      )`);
      params.push(term, term, term, term, term, term, term, term);
    }

    if (blood_group && blood_group !== '') {
      whereConditions.push('blood_group = ?');
      params.push(blood_group);
    }

    if (department && department !== '') {
      whereConditions.push('department = ?');
      params.push(department);
    }

    if (state_ut && state_ut !== '') {
      whereConditions.push('state_ut = ?');
      params.push(state_ut);
    }

    if (language && language !== '') {
      whereConditions.push('languages LIKE ?');
      params.push(`%${language}%`);
    }

    if (last_donated_start && last_donated_start !== '') {
      whereConditions.push('last_donated_date >= ?');
      params.push(last_donated_start);
    }

    if (last_donated_end && last_donated_end !== '') {
      whereConditions.push('last_donated_date <= ?');
      params.push(last_donated_end);
    }

    if (has_health_problem !== undefined && has_health_problem !== '') {
      whereConditions.push('has_health_problem = ?');
      params.push(has_health_problem === 'true' || has_health_problem === '1' ? 1 : 0);
    }

    if (has_regular_medicine !== undefined && has_regular_medicine !== '') {
      whereConditions.push('has_regular_medicine = ?');
      params.push(has_regular_medicine === 'true' || has_regular_medicine === '1' ? 1 : 0);
    }

    if (consumes_alcohol_substance !== undefined && consumes_alcohol_substance !== '') {
      whereConditions.push('consumes_alcohol_substance = ?');
      params.push(consumes_alcohol_substance === 'true' || consumes_alcohol_substance === '1' ? 1 : 0);
    }

    const whereSql = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Count query
    const countSql = `SELECT COUNT(*) as total FROM donors ${whereSql}`;
    const [countRows] = await db.query(countSql, params);
    const totalCount = countRows[0].total || countRows[0]['COUNT(*)'] || 0;

    // Sorting columns white-list
    const allowedSortColumns = ['name', 'blood_group', 'register_number', 'department', 'last_donated_date', 'created_at'];
    const safeSortBy = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const safeSortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const safeLimit = Math.max(1, parseInt(limit, 10) || 10);
    const offset = Math.max(0, (parseInt(page, 10) - 1) * safeLimit);

    const dataSql = `
      SELECT * FROM donors
      ${whereSql}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ${safeLimit} OFFSET ${offset}
    `;

    const [rows] = await db.query(dataSql, params);

    const donors = rows.map(donor => {
      try {
        donor.languages = JSON.parse(donor.languages);
      } catch (e) {
        if (typeof donor.languages === 'string') {
          donor.languages = donor.languages.split(',').map(s => s.trim());
        }
      }
      return donor;
    });

    return {
      donors,
      totalCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / safeLimit) || 1
    };
  },

  async publicSearch(options = {}) {
    const { blood_group, department, state_ut, search } = options;
    let whereConditions = [];
    let params = [];

    if (blood_group && blood_group.trim() !== '') {
      whereConditions.push('blood_group = ?');
      params.push(blood_group.trim());
    }

    if (department && department.trim() !== '') {
      whereConditions.push('department = ?');
      params.push(department.trim());
    }

    if (state_ut && state_ut.trim() !== '') {
      whereConditions.push('state_ut = ?');
      params.push(state_ut.trim());
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      whereConditions.push('(name LIKE ? OR department LIKE ? OR state_ut LIKE ?)');
      params.push(term, term, term);
    }

    const whereSql = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const sql = `
      SELECT id, name, blood_group, department, contact_number, email, state_ut, languages, last_donated_date
      FROM donors
      ${whereSql}
      ORDER BY name ASC
      LIMIT 100
    `;

    const [rows] = await db.query(sql, params);
    return rows.map(donor => {
      try {
        donor.languages = JSON.parse(donor.languages);
      } catch (e) {
        if (typeof donor.languages === 'string') {
          donor.languages = donor.languages.split(',').map(s => s.trim());
        }
      }
      return donor;
    });
  },

  async update(id, donorData) {
    const {
      name,
      blood_group,
      last_donated_date,
      department,
      register_number,
      contact_number,
      alt_contact_number,
      email,
      state_ut,
      languages,
      has_health_problem,
      health_problem_details,
      has_regular_medicine,
      medicine_details,
      consumes_alcohol_substance
    } = donorData;

    const languagesJson = parseLanguagesJson(languages);
    const healthProblemBool = toBoolInt(has_health_problem);
    const regularMedicineBool = toBoolInt(has_regular_medicine);
    const alcoholSubstanceBool = toBoolInt(consumes_alcohol_substance);

    const sql = `
      UPDATE donors
      SET
        name = ?, blood_group = ?, last_donated_date = ?, department = ?,
        register_number = ?, contact_number = ?, alt_contact_number = ?, email = ?,
        state_ut = ?, languages = ?, has_health_problem = ?, health_problem_details = ?,
        has_regular_medicine = ?, medicine_details = ?, consumes_alcohol_substance = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      String(name).trim(),
      String(blood_group).trim(),
      last_donated_date ? String(last_donated_date).trim() : null,
      String(department).trim(),
      String(register_number).trim(),
      String(contact_number).trim(),
      alt_contact_number ? String(alt_contact_number).trim() : null,
      String(email).trim(),
      String(state_ut).trim(),
      languagesJson,
      healthProblemBool,
      healthProblemBool === 1 && health_problem_details ? String(health_problem_details).trim() : null,
      regularMedicineBool,
      regularMedicineBool === 1 && medicine_details ? String(medicine_details).trim() : null,
      alcoholSubstanceBool,
      id
    ];

    const [result] = await db.query(sql, params);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query('DELETE FROM donors WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = DonorModel;
