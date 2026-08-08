const app = require('../app');
const { initDatabase } = require('../config/database');

let isDbInitialized = false;

module.exports = async (req, res) => {
  if (!isDbInitialized) {
    try {
      await initDatabase();
      isDbInitialized = true;
    } catch (err) {
      console.error('[Vercel Serverless] Database init error:', err);
    }
  }
  return app(req, res);
};
