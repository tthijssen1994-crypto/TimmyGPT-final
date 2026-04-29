const OpenAI = require("openai");
const { getHistory, addMessage } = require("./memory");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function askAI(user, prompt) {
  try {
    console.log("➡️ Vraag naar AI:", prompt);

    addMessage(user, "user", prompt);

    const response = await openai.responses.create({
      model: "gpt-4.1-mini", // stabiel model
      input: getHistory(user).map(m => `${m.role}: ${m.content}`).join("\n")
    });

    const reply = response.output_text;

    console.log("✅ AI antwoord:", reply);

    if (!reply) return "⚠️ Geen antwoord van AI";

    addMessage(user, "assistant", reply);

    return reply;

  } catch (err) {
    console.error("❌ AI ERROR FULL:", err);

    if (err.code === "invalid_api_key") {
      return "🔑 Je OpenAI API key is ongeldig";
    }

    if (err.code === "insufficient_quota") {
      return "💸 Je OpenAI tegoed is op";
    }

    return "❌ AI kapot (check console)";
  }
}

module.exports = { askAI };