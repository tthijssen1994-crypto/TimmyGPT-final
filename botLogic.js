const OpenAI = require("openai");
const { query } = require('./database');
const { searchInternet } = require('./search');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function handleBotLogic(user, message) {
  // sla user message op
  await query(
    "INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)",
    [user, "user", message]
  );

  // haal history op (kort houden!)
  const history = await query(
    "SELECT role, content FROM messages WHERE user_id=$1 ORDER BY id DESC LIMIT 5",
    [user]
  );

  const messages = history.rows.reverse().map(m => ({
    role: m.role,
    content: m.content
  }));

  // 🧠 detecteer of internet nodig is
  let extraContext = "";

  if (
    message.toLowerCase().includes("nieuws") ||
    message.toLowerCase().includes("prijs") ||
    message.toLowerCase().includes("wie is") ||
    message.toLowerCase().includes("wat is") ||
    message.toLowerCase().includes("update")
  ) {
    const searchResult = await searchInternet(message);
    extraContext = `\n\nInternet info: ${searchResult}`;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
Je bent TimmyGPT, een slimme AI assistent.

- Antwoord altijd in het Nederlands
- Wees duidelijk en behulpzaam
- Gebruik internet info als die gegeven wordt
- Ga niet onnodig over de gebruiker praten
`
      },
      ...messages,
      {
        role: "user",
        content: message + extraContext
      }
    ]
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