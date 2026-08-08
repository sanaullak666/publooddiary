const app = require('../app');
const { initDatabase } = require('../config/database');

let dbPromise = null;

module.exports = async (req, res) => {
  if (!dbPromise) {
    dbPromise = initDatabase().catch(err => {
      console.error('[Vercel Serverless] Database init error:', err);
      dbPromise = null;
    });
  }
  await dbPromise;
  return app(req, res);
};
