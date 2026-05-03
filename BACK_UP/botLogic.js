const OpenAI = require("openai");
const { query } = require('./database');
const { getBitcoinPrice } = require('./crypto');
const { searchInternet } = require('./search');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const cache = new Map();

// 🔥 slimme detectie
function needsInternet(msg) {
  return (
    msg.includes("wie is") ||
    msg.includes("wat is") ||
    msg.includes("nieuws") ||
    msg.includes("prijs") ||
    msg.includes("wanneer")
  );
}

// 🧠 RESET
async function resetMemory(user) {
  await query("DELETE FROM messages WHERE user_id=$1", [user]);
}

// 🚀 MAIN
async function handleBotLogic(user, message) {
  const lower = message.toLowerCase();

  try {
    // ⚡ CACHE (TTL 2 min)
    if (cache.has(lower)) {
      return "⚡ " + cache.get(lower);
    }

    // 💰 DIRECT COMMAND
    if (lower.includes("bitcoin")) {
      return await getBitcoinPrice();
    }

    // 🧠 HISTORY
    const history = await query(
      "SELECT role, content FROM messages WHERE user_id=$1 ORDER BY id DESC LIMIT 6",
      [user]
    );

    const messages = history.rows.reverse();

    // 🌐 INTERNET fallback
    let internetData = null;
    if (needsInternet(lower)) {
      internetData = await searchInternet(message);
    }

    const systemPrompt = `
Je bent een slimme, snelle AI bot.
Antwoord kort, duidelijk en in het Nederlands.

${internetData ? `Gebruik deze internet info indien relevant:\n${internetData}` : ""}
`;

    const aiCall = openai.chat.completions.create({
      model: "gpt-4o-mini", // ⚡ sneller + goedkoper + beter
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
        { role: "user", content: message }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 7000)
    );

    const response = await Promise.race([aiCall, timeout]);

    let reply = response.choices[0].message.content || "⚠️ Geen antwoord";

    // ✂️ Discord limit
    if (reply.length > 1900) {
      reply = reply.slice(0, 1900) + "...";
    }

    // 💾 SAVE (async, niet blokkeren)
    query(
      "INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)",
      [user, "user", message]
    ).catch(() => {});

    query(
      "INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)",
      [user, "assistant", reply]
    ).catch(() => {});

    // ⚡ CACHE SAVE
    cache.set(lower, reply);
    setTimeout(() => cache.delete(lower), 120000);

    return reply;

  } catch (err) {
    console.error("BOT ERROR:", err.message);

    // 🆘 fallback naar internet-only
    const fallback = await searchInternet(message);
    if (fallback) return "🌐 " + fallback;

    return "⚠️ Bot tijdelijk traag, probeer opnieuw.";
  }
}

module.exports = { handleBotLogic, resetMemory };