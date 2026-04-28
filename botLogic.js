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

  const messages = history.rows.reverse().map(m => ({
    role: m.role,
    content: m.content
  }));

  // 🧠 TOOL DEFINITIE
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
              type: "string",
              description: "De zoekopdracht"
            }
          },
          required: ["query"]
        }
      }
    }
  ];

  // 🔥 EERSTE AI CALL (beslist of hij wil zoeken)
  const firstResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
Je bent TimmyGPT.

- Antwoord altijd in het Nederlands
- Gebruik de searchInternet tool ALLEEN als je iets niet zeker weet of actuele info nodig hebt
- Geef duidelijke antwoorden
`
      },
      ...messages,
      {
        role: "user",
        content: message
      }
    ],
    tools
  });

  const msg = firstResponse.choices[0].message;

  // 🔎 ALS AI WIL ZOEKEN
  if (msg.tool_calls) {
    const toolCall = msg.tool_calls[0];
    const args = JSON.parse(toolCall.function.arguments);

    const result = await searchInternet(args.query);

    // 🔥 TWEEDE CALL MET RESULTAAT
    const secondResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        ...messages,
        {
          role: "user",
          content: message
        },
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

  // 🧠 GEWOON ANTWOORD
  const reply = msg.content;

  await query(
    "INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)",
    [user, "assistant", reply]
  );

  return reply;
}

module.exports = { handleBotLogic };