const { db, initDatabase } = require('../config/database');

async function seedDonors() {
  await initDatabase();
  // Do not auto-seed sample donors; only maintain authentic registered donors.
  console.log('[Seed] No sample donors seeded. Preserving registered donor database.');
}

if (require.main === module) {
  seedDonors().then(() => process.exit(0));
}

module.exports = seedDonors;
