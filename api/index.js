const app = require('../app');
const { initDatabase } = require('../config/database');

let dbPromise = null;

function ensureDbInit() {
  if (!dbPromise) {
    dbPromise = initDatabase().catch(err => {
      console.error('[Vercel Serverless] Database init error:', err ? err.message : err);
      dbPromise = null;
    });
  }
  return dbPromise;
}

module.exports = async (req, res) => {
  ensureDbInit();
  
  // Only block for database initialization on API requests
  if (req.url && (req.url.startsWith('/api/') || req.url.startsWith('/api'))) {
    await dbPromise;
  }
  
  return app(req, res);
};
