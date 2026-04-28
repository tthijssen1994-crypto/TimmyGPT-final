const OpenAI = require("openai");
const { query } = require('./database');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function handleBotLogic(user, message) {
  // sla user message op
  await query(
    "INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)",
    [user, "user", message]
  );

  // haal laatste berichten op
  const history = await query(
    "SELECT role, content FROM messages WHERE user_id=$1 ORDER BY id DESC LIMIT 10",
    [user]
  );

  const messages = history.rows.reverse();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages
  });

  const reply = completion.choices[0].message.content;

  // sla antwoord op
  await query(
    "INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)",
    [user, "assistant", reply]
  );

  return reply;
}

module.exports = { handleBotLogic };