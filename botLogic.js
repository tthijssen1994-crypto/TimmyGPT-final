const OpenAI = require('openai');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


// 🧠 LOCAL FACT EXTRACTION (BETROUWBAAR)
function extractFacts(input) {
    const facts = [];

    // naam
    const nameMatch = input.match(/mijn naam is (\w+)/i);
    if (nameMatch) {
        facts.push({ key: "name", value: nameMatch[1] });
    }

    // leeftijd
    const ageMatch = input.match(/ik ben (\d+) jaar/i);
    if (ageMatch) {
        facts.push({ key: "age", value: ageMatch[1] });
    }

    // woonplaats
    const cityMatch = input.match(/ik woon in (\w+)/i);
    if (cityMatch) {
        facts.push({ key: "city", value: cityMatch[1] });
    }

    return facts;
}


// 🤖 MAIN BOT LOGIC
async function handleBotLogic(input, user) {
    console.log("🔥 BOT:", user, input);

    try {
        // 🧠 facts opslaan
        const facts = extractFacts(input);

        for (const f of facts) {
            await pool.query(
                "INSERT INTO facts (user_id, key, value) VALUES ($1,$2,$3)",
                [user, f.key, f.value]
            );
        }

        // 💾 user message opslaan
        await pool.query(
            "INSERT INTO messages (user_id, role, content) VALUES ($1,$2,$3)",
            [user, "user", input]
        );

        // 📜 history ophalen
        const historyRes = await pool.query(
            "SELECT role, content FROM messages WHERE user_id=$1 ORDER BY id DESC LIMIT 10",
            [user]
        );

        // 📌 facts ophalen
        const factRes = await pool.query(
            "SELECT key, value FROM facts WHERE user_id=$1",
            [user]
        );

        const factText = factRes.rows
            .map(f => `${f.key}: ${f.value}`)
            .join(", ");

        // 🤖 AI response
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `
Je bent een slimme AI assistant.

Gebruiker info:
${factText}

Gebruik deze info actief.
Als naam bekend is → gebruik die.
Zeg NOOIT dat je geen info hebt als het hierboven staat.
`
                },
                ...historyRes.rows.reverse()
            ]
        });

        const reply = response.choices[0].message.content;

        // 💾 bot response opslaan
        await pool.query(
            "INSERT INTO messages (user_id, role, content) VALUES ($1,$2,$3)",
            [user, "assistant", reply]
        );

        return reply;

    } catch (err) {
        console.error("❌ ERROR:", err);
        return "Er ging iets mis 😅";
    }
}


// 🔄 RESET
async function resetMemory(user) {
    await pool.query("DELETE FROM messages WHERE user_id=$1", [user]);
    await pool.query("DELETE FROM facts WHERE user_id=$1", [user]);
}

module.exports = { handleBotLogic, resetMemory };