const OpenAI = require("openai");
const { query } = require('./database');
const { searchInternet } = require('./search');
const { getBitcoinPrice } = require('./crypto');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ⚡ simpele cache
const cache = new Map();

// 🧠 RESET MEMORY
async function resetMemory(user) {
  await query("DELETE FROM messages WHERE user_id=$1", [user]);
}

// 🤖 MAIN LOGIC (SNELLE VERSIE)
async function handleBotLogic(user, message) {
  try {
    const lower = message.toLowerCase();

    // ⚡ CACHE (super snel)
    if (cache.has(lower)) {
      return "⚡ " + cache.get(lower);
    }

    // 💰 BITCOIN DIRECT
    if (lower.includes("bitcoin")) {
      return await getBitcoinPrice();
    }

    // ⚡ HISTORY (korter = sneller)
    const history = await query(
      "SELECT role, content FROM messages WHERE user_id=$1 ORDER BY id DESC LIMIT 4",
      [user]
    );

    const messages = history.rows.reverse();

    // ⏱️ TIMEOUT
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 8000)
    );

    const aiCall = openai.chat.completions.create({
      model: "gpt-4o-mini", // sneller model
      messages: [
        {
          role: "system",
          content: "Je bent een snelle, slimme Discord bot. Antwoord kort en duidelijk in het Nederlands."
        },
        ...messages,
        { role: "user", content: message }
      ],
      max_tokens: 200 // ⚡ sneller
    });

    const response = await Promise.race([aiCall, timeout]);

    let reply = response.choices[0].message.content;

    if (!reply) reply = "⚠️ Geen antwoord";

    // ✂️ lengte fix (Discord limit)
    if (reply.length > 1900) {
      reply = reply.slice(0, 1900) + "...";
    }

    // 💾 opslaan
    await query(
      "INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)",
      [user, "user", message]
    );

    await query(
      "INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)",
      [user, "assistant", reply]
    );

    // ⚡ cache opslaan
    cache.set(lower, reply);

    return reply;

  } catch (err) {
    console.error("BOT ERROR:", err.message);
    return "⚡ Bot is even traag, probeer opnieuw...";
  }
}

module.exports = { handleBotLogic, resetMemory };