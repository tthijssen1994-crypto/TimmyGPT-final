const OpenAI = require("openai");
const { query } = require('./database');
const { searchInternet } = require('./search');
const { getBitcoinPrice } = require('./crypto');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🧠 RESET MEMORY
async function resetMemory(user) {
  await query("DELETE FROM messages WHERE user_id=$1", [user]);
}

// 🤖 MAIN LOGIC
async function handleBotLogic(user, message) {
  const lower = message.toLowerCase();

  // sla user message op
  await query(
    "INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)",
    [user, "user", message]
  );

  // 💰 SLIMME BITCOIN CHECK (alleen bij prijs vragen)
  if (lower.includes("bitcoin") && lower.includes("prijs")) {
    const price = await getBitcoinPrice();

    await query(
      "INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)",
      [user, "assistant", price]
    );

    return price;
  }

  // 📚 HISTORY
  const history = await query(
    "SELECT role, content FROM messages WHERE user_id=$1 ORDER BY id DESC LIMIT 6",
    [user]
  );

  const messages = history.rows
    .reverse()
    .filter(m =>
      m.content &&
      m.content.length < 300 &&
      !m.content.toLowerCase().includes("kappa")
    )
    .map(m => ({
      role: m.role,
      content: m.content
    }));

  // 🔧 TOOL
  const tools = [
    {
      type: "function",
      function: {
        name: "searchInternet",
        description: "Zoek actuele informatie op internet",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" }
          },
          required: ["query"]
        }
      }
    }
  ];

  // 🚀 AI CALL
  const firstResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
Je bent TimmyGPT.

- Antwoord ALTIJD in het Nederlands
- Geef duidelijke en directe antwoorden
- Gebruik searchInternet bij actuele info (prijzen, nieuws, etc)
- Ga NIET over de gebruiker praten tenzij gevraagd
`
      },
      ...messages,
      { role: "user", content: message }
    ],
    tools,
    tool_choice: "auto"
  });

  const msg = firstResponse.choices[0].message;

  // 🔎 TOOL CALL
  if (msg.tool_calls) {
    try {
      const toolCall = msg.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

      const result = await searchInternet(args.query);

      const secondResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          ...messages,
          { role: "user", content: message },
          msg,
          {
            role: "tool",
            tool_call_id: toolCall.id,
            content: result
          }
        ]
      });

      const reply = secondResponse.choices[0].message.content;

      await query(
        "INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)",
        [user, "assistant", reply]
      );

      return reply;

    } catch (err) {
      console.error("Tool error:", err);
    }
  }

  // 🔥 FALLBACK SEARCH
  if (
    lower.includes("prijs") ||
    lower.includes("nieuws") ||
    lower.includes("wie is") ||
    lower.includes("wat is")
  ) {
    try {
      const result = await searchInternet(message);

      const forcedResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Gebruik deze internet info om de vraag te beantwoorden."
          },
          {
            role: "user",
            content: message + "\n\n" + result
          }
        ]
      });

      const reply = forcedResponse.choices[0].message.content;

      await query(
        "INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)",
        [user, "assistant", reply]
      );

      return reply;

    } catch (err) {
      console.error("Fallback error:", err);
    }
  }

  // 💬 NORMAAL ANTWOORD
  const reply = msg.content || "Hmm, daar weet ik even geen antwoord op.";

  await query(
    "INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)",
    [user, "assistant", reply]
  );

  return reply;
}

module.exports = { handleBotLogic, resetMemory };