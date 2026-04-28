require('dotenv').config();

const { initDB } = require('./initDb');

require('./telegram');
require('./discord');
require('./dashboard');

initDB();

console.log("🚀 Alles draait");