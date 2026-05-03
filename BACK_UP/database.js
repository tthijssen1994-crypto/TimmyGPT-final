const { Pool } = require("pg");

const pool = new Pool({
connectionString: process.env.DATABASE_URL
});

async function query(q, params) {
return pool.query(q, params);
}

module.exports = { query };
