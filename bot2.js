const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const OpenAI = require("openai");

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY,
});

const cache = new Map();

client.once('ready', () => {
console.log("BOT ONLINE");
});

client.on('messageCreate', async (msg) => {
if (msg.author.bot) return;

const text = msg.content.toLowerCase();

console.log("INPUT:", text);

// CACHE
if (cache.has(text)) {
return msg.reply("Cached: " + cache.get(text));
}

// ======================
// CRYPTO (SAFE)
// ======================
if (text.includes("btc") || text.includes("bitcoin")) {
try {
const res = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
const price = res.data.bitcoin.usd;

```
  const reply = "BTC: $" + price;
  cache.set(text, reply);

  return msg.reply(reply);

} catch (err) {
  console.error(err);
  return msg.reply("Crypto error");
}
```

}

// ======================
// WEATHER (SAFE)
// ======================
if (text.includes("weer")) {
const city = text.split("weer in")[1]?.trim() || "amsterdam";

```
try {
  const res = await axios.get("https://wttr.in/" + city + "?format=3");

  const reply = "Weather: " + res.data;
  cache.set(text, reply);

  return msg.reply(reply);

} catch (err) {
  console.error(err);
  return msg.reply("Weather error");
}
```

}

// ======================
// AI
// ======================
try {
const ai = await openai.chat.completions.create({
model: "gpt-4o-mini",
messages: [
{ role: "user", content: text }
],
max_tokens: 200
});

```
const reply = ai.choices[0].message.content || "No response";

cache.set(text, reply);

return msg.reply(reply);
```

} catch (err) {
console.error(err);
return msg.reply("AI error");
}
});

client.login(process.env.DISCORD_TOKEN);
