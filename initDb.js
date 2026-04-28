const { query } = require('./database');

async function initDB() {
  await query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      user_id TEXT,
      role TEXT,
      content TEXT
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS facts (
      id SERIAL PRIMARY KEY,
      user_id TEXT,
      key TEXT,
      value TEXT
    );
  `);

  console.log("Database klaar ✅");
}

module.exports = { initDB };