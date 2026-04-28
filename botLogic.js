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

  // haal history op
  const history = await query(
    "SELECT role, content FROM messages WHERE user_id=$1 ORDER BY id DESC LIMIT 5",
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

  // TOOL
  const tools = [
    {
      type: "function",
      function: {
        name: "searchInternet",
        description: "Zoek actuele informatie op internet",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string"
            }
          },
          required: ["query"]
        }
      }
    }
  ];

  // 🔥 eerste call
  const firstResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
Je bent TimmyGPT.

- Antwoord altijd in het Nederlands
- Gebruik searchInternet bij actuele info
- Ga niet over de gebruiker praten tenzij gevraagd
`
      },
      ...messages,
      {
        role: "user",
        content: message
      }
    ],
    tools,
    tool_choice: "auto"
  });

  const msg = firstResponse.choices[0].message;

  // 🔎 TOOL CALL
  if (msg.tool_calls) {
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
  }

  // 🔥 FORCE SEARCH fallback
  if (
    message.toLowerCase().includes("prijs") ||
    message.toLowerCase().includes("bitcoin") ||
    message.toLowerCase().includes("nieuws")
  ) {
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
  }

  // normaal antwoord
  const reply = msg.content;

  await query(
    "INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)",
    [user, "assistant", reply]
  );

  return reply;
}

module.exports = { handleBotLogic };