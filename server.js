const app = require('./app');
const { initDatabase } = require('./config/database');
const seedDonors = require('./utils/seed');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('----------------------------------------------------');
    console.log('  PU Blood Diary - Pondicherry University');
    console.log('  An initiative by NSS Pondicherry University');
    console.log('----------------------------------------------------');

    // Initialize Database
    await initDatabase();

    // Seed Sample Donors if database is fresh
    await seedDonors();

    app.listen(PORT, () => {
      console.log(`[Server] PU Blood Diary running on http://localhost:${PORT}`);
      console.log(`[Server] Admin Portal available at http://localhost:${PORT}/admin/login`);
      console.log('----------------------------------------------------');
    });
  } catch (err) {
    console.error('[Server] Critical Startup Error:', err);
    process.exit(1);
  }
}

startServer();
