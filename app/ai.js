const OpenAI = require("openai");
const { getCache, setCache } = require("./cache");

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY,
});

async function handleAIStream({ user, message, onToken }) {
const cacheKey = message.toLowerCase();

// ⚡ CACHE
const cached = getCache(cacheKey);
if (cached) {
return onToken("⚡ " + cached);
}

let full = "";

const stream = await openai.chat.completions.create({
model: "gpt-4o-mini",
stream: true,
messages: [
{
role: "system",
content: "Je bent een slimme AI. Antwoord kort en duidelijk in het Nederlands."
},
{ role: "user", content: message }
]
});

for await (const chunk of stream) {
const token = chunk.choices[0]?.delta?.content;
if (!token) continue;

```
full += token;

await onToken(full);
```

}

setCache(cacheKey, full);

return full;
}

module.exports = { handleAIStream };
