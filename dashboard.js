const express = require('express');
const { Pool } = require('pg');

const app = express();
app.set('view engine', 'ejs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

app.get('/', async (req, res) => {
    const users = await pool.query("SELECT DISTINCT user_id FROM messages");

    const data = [];

    for (const u of users.rows) {
        const msgs = await pool.query(
            "SELECT role,content FROM messages WHERE user_id=$1 ORDER BY id DESC LIMIT 5",
            [u.user_id]
        );

        const facts = await pool.query(
            "SELECT key,value FROM facts WHERE user_id=$1",
            [u.user_id]
        );

        data.push({
            user: u.user_id,
            messages: msgs.rows,
            facts: facts.rows
        });
    }

    res.render('index', { data });
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Dashboard live");
});