const OpenAI = require("openai");
const { query } = require('./database');
const { getBitcoinPrice } = require('./crypto');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ⚡ simpele cache
const cache = new Map();

// 🧠 RESET MEMORY
async function resetMemory(user) {
  try {
    await query("DELETE FROM messages WHERE user_id=$1", [user]);
    console.log(`Memory reset for user: ${user}`);
  } catch (error) {
    console.error(`Error resetting memory for user ${user}:`, error);
  }
}

// 🤖 MAIN LOGIC (SNELLE VERSIE)
async function handleBotLogic(user, message) {
  try {
    const lower = message.toLowerCase();

    // ⚡ CACHE (super snel)
    if (cache.has(lower)) {
      console.log(`Cache hit for user ${user}: ${lower}`);
      return "⚡ " + cache.get(lower);
    }

    // 💰 BITCOIN DIRECT
    if (lower.includes("bitcoin")) {
      console.log(`Bitcoin price requested by ${user}`);
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
      model: "gpt-4", // Sneller en nieuwere versie
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

    // ✂️ Lengte fix (Discord limit)
    if (reply.length > 1900) {
      reply = reply.slice(0, 1900) + "...";
    }

    // 💾 opslaan in database
    try {
      await query(
        "INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)",
        [user, "user", message]
      );

      await query(
        "INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)",
        [user, "assistant", reply]
      );

      console.log(`Saved message from ${user} to database.`);
    } catch (err) {
      console.error("Database error while saving messages:", err.message);
    }

    // ⚡ Cache opslaan
    cache.set(lower, reply);

    console.log(`Reply for user ${user}:`, reply);
    return reply;

  } catch (err) {
    console.error("BOT ERROR:", err.message);
    return "⚡ Bot is even traag, probeer opnieuw...";
  }
}

module.exports = { handleBotLogic, resetMemory };
