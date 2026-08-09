const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const os = require('os');
let dbType = 'mysql';
let pool = null;
let sqliteDb = null;

// Ensure database directory exists for SQLite fallback
const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

function adaptSql(sql) {
  return sql;
}

let dbInitPromise = null;

function ensureDatabase() {
  if (!dbInitPromise) {
    dbInitPromise = initDatabase().catch(err => {
      dbInitPromise = null;
      throw err;
    });
  }
  return dbInitPromise;
}

const db = {
  getEngine: () => dbType,

  async query(sql, params = []) {
    await ensureDatabase();
    if (dbType === 'mysql') {
      return await pool.query(sql, params);
    } else {
      return new Promise((resolve, reject) => {
        const cleanSql = adaptSql(sql);
        const lowerSql = cleanSql.trim().toLowerCase();

        if (lowerSql.startsWith('select')) {
          sqliteDb.all(cleanSql, params, (err, rows) => {
            if (err) return reject(err);
            resolve([rows]);
          });
        } else {
          sqliteDb.run(cleanSql, params, function (err) {
            if (err) return reject(err);
            resolve([{
              affectedRows: this.changes,
              insertId: this.lastID
            }]);
          });
        }
      });
    }
  },

  async execute(sql, params = []) {
    return this.query(sql, params);
  }
};

async function initDatabase() {
  if (sqliteDb) return;

  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const dbPath = isServerless ? path.join(os.tmpdir(), 'pu_blood.db') : path.join(dbDir, 'pu_blood.db');

  dbType = 'sqlite';
  await new Promise((resolve, reject) => {
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  console.log(`[Database] Fast Local Database initialized at: ${dbPath}`);
  await setupTablesSQLite();

  // Attempt optional remote MySQL / TiDB connection only if explicitly requested via USE_REMOTE_DB
  if (process.env.USE_REMOTE_DB === 'true') {
    let dbHost = process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';
    let dbUser = process.env.DB_USER || 'vhWoeruys6ZvbgF.root';
    let dbPassword = process.env.DB_PASSWORD || '8LMTB3ARZzdZBPkB';
    let dbName = process.env.DB_NAME || 'test';
    let dbPort = parseInt(process.env.DB_PORT || '4000', 10);

    const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.TIDB_URL;
    if (databaseUrl) {
      try {
        const parsedUrl = new URL(databaseUrl);
        if (parsedUrl.hostname) dbHost = parsedUrl.hostname;
        if (parsedUrl.port) dbPort = parseInt(parsedUrl.port, 10);
        if (parsedUrl.username) dbUser = decodeURIComponent(parsedUrl.username);
        if (parsedUrl.password) dbPassword = decodeURIComponent(parsedUrl.password);
        const dbPath = parsedUrl.pathname.replace(/^\//, '');
        if (dbPath && dbPath !== 'sys') dbName = dbPath;
      } catch (e) {}
    }
    if (dbName === 'sys') dbName = 'test';

    const useSsl = process.env.DB_SSL === 'false' ? false : true;
    const connectionOptions = {
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      connectTimeout: 5000,
      ...(useSsl ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' } } : {})
    };

    try {
      pool = mysql.createPool({
        ...connectionOptions,
        database: dbName,
        waitForConnections: true,
        connectionLimit: 5,
        maxIdle: 0,
        idleTimeout: 1000,
        enableKeepAlive: false,
        queueLimit: 0
      });

      await pool.query('SELECT 1');
      dbType = 'mysql';
      console.log(`[Database] Remote MySQL/TiDB database connected '${dbName}' on ${dbHost}:${dbPort}`);
      await setupTablesMySQL();
    } catch (mysqlErr) {
      console.warn(`[Database] Remote MySQL notice (${mysqlErr.message}). Continuing with local database.`);
      dbType = 'sqlite';
    }
  }

  await seedDefaultAdmin();
  await seedInitialDonors();
}

async function setupTablesMySQL() {
  const createAdmins = `
    CREATE TABLE IF NOT EXISTS \`admins\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`username\` VARCHAR(50) NOT NULL UNIQUE,
      \`password\` VARCHAR(255) NOT NULL,
      \`email\` VARCHAR(100) NOT NULL UNIQUE,
      \`name\` VARCHAR(100) NOT NULL,
      \`role\` VARCHAR(20) DEFAULT 'administrator',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX \`idx_admin_username\` (\`username\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createDonors = `
    CREATE TABLE IF NOT EXISTS \`donors\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`user_type\` VARCHAR(20) NOT NULL DEFAULT 'student',
      \`name\` VARCHAR(100) NOT NULL,
      \`blood_group\` VARCHAR(25) NOT NULL,
      \`last_donated_date\` DATE NULL,
      \`department\` VARCHAR(150) NOT NULL,
      \`register_number\` VARCHAR(50) NOT NULL UNIQUE,
      \`contact_number\` VARCHAR(15) NOT NULL,
      \`alt_contact_number\` VARCHAR(15) NULL,
      \`email\` VARCHAR(100) NOT NULL UNIQUE,
      \`state_ut\` VARCHAR(100) NOT NULL,
      \`languages\` TEXT NOT NULL,
      \`has_health_problem\` TINYINT(1) NOT NULL DEFAULT 0,
      \`health_problem_details\` TEXT NULL,
      \`has_regular_medicine\` TINYINT(1) NOT NULL DEFAULT 0,
      \`medicine_details\` TEXT NULL,
      \`consumes_alcohol_substance\` TINYINT(1) NOT NULL DEFAULT 0,
      \`declaration_agreed\` TINYINT(1) NOT NULL DEFAULT 1,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX \`idx_donor_user_type\` (\`user_type\`),
      INDEX \`idx_donor_blood_group\` (\`blood_group\`),
      INDEX \`idx_donor_department\` (\`department\`),
      INDEX \`idx_donor_state\` (\`state_ut\`),
      INDEX \`idx_donor_reg_no\` (\`register_number\`),
      INDEX \`idx_donor_email\` (\`email\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createLogs = `
    CREATE TABLE IF NOT EXISTS \`activity_logs\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`admin_username\` VARCHAR(50) NOT NULL,
      \`action\` VARCHAR(100) NOT NULL,
      \`details\` TEXT NULL,
      \`ip_address\` VARCHAR(45) NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX \`idx_log_admin\` (\`admin_username\`),
      INDEX \`idx_log_action\` (\`action\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createPendingUpdates = `
    CREATE TABLE IF NOT EXISTS \`pending_donation_updates\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`donor_id\` INT NOT NULL,
      \`register_number\` VARCHAR(50) NOT NULL,
      \`donor_name\` VARCHAR(100) NOT NULL,
      \`current_date\` DATE NULL,
      \`requested_date\` DATE NOT NULL,
      \`status\` VARCHAR(20) DEFAULT 'pending',
      \`requested_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`reviewed_at\` TIMESTAMP NULL,
      \`reviewed_by\` VARCHAR(50) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createSettings = `
    CREATE TABLE IF NOT EXISTS \`system_settings\` (
      \`setting_key\` VARCHAR(50) PRIMARY KEY,
      \`setting_value\` VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await pool.query(createAdmins);
  await pool.query(createDonors);
  await pool.query(createLogs);
  await pool.query(createPendingUpdates);
  await pool.query(createSettings);

  try {
    await pool.query("ALTER TABLE `donors` ADD COLUMN `user_type` VARCHAR(20) NOT NULL DEFAULT 'student'");
  } catch (e) {
    // Column already exists
  }
}

async function setupTablesSQLite() {
  const createAdmins = `
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'administrator',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createDonors = `
    CREATE TABLE IF NOT EXISTS donors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_type TEXT NOT NULL DEFAULT 'student',
      name TEXT NOT NULL,
      blood_group TEXT NOT NULL,
      last_donated_date TEXT NULL,
      department TEXT NOT NULL,
      register_number TEXT NOT NULL UNIQUE,
      contact_number TEXT NOT NULL,
      alt_contact_number TEXT NULL,
      email TEXT NOT NULL UNIQUE,
      state_ut TEXT NOT NULL,
      languages TEXT NOT NULL,
      has_health_problem INTEGER NOT NULL DEFAULT 0,
      health_problem_details TEXT NULL,
      has_regular_medicine INTEGER NOT NULL DEFAULT 0,
      medicine_details TEXT NULL,
      consumes_alcohol_substance INTEGER NOT NULL DEFAULT 0,
      declaration_agreed INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createLogs = `
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_username TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NULL,
      ip_address TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createPendingUpdates = `
    CREATE TABLE IF NOT EXISTS pending_donation_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      donor_id INTEGER NOT NULL,
      register_number TEXT NOT NULL,
      donor_name TEXT NOT NULL,
      current_date TEXT NULL,
      requested_date TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME NULL,
      reviewed_by TEXT NULL
    );
  `;

  const createSettings = `
    CREATE TABLE IF NOT EXISTS system_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT NOT NULL
    );
  `;

  await db.query(createAdmins);
  await db.query(createDonors);
  await db.query(createLogs);
  await db.query(createPendingUpdates);
  await db.query(createSettings);

  try {
    await db.query("ALTER TABLE donors ADD COLUMN user_type TEXT DEFAULT 'student'");
  } catch (e) {
    // Column already exists
  }
}

async function seedDefaultAdmin() {
  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', ['admin']);
    if (!rows || rows.length === 0) {
      const hashedPassword = await bcrypt.hash('Password@123', 10);
      await db.query(
        'INSERT INTO admins (username, password, email, name, role) VALUES (?, ?, ?, ?, ?)',
        ['admin', hashedPassword, 'nss@pondiuni.edu.in', 'Admin', 'administrator']
      );
      console.log('[Database] Default admin created: username="admin", password="Password@123"');
    } else {
      await db.query('UPDATE admins SET name = ? WHERE username = ?', ['Admin', 'admin']);
    }
  } catch (e) {
    console.error('[Database] Failed to seed default admin:', e);
  }
}

async function seedInitialDonors() {
  // Do not auto-seed sample donors; preserve authentic donor registrations and admin deletions.
  return;
}

module.exports = {
  db,
  initDatabase
};
