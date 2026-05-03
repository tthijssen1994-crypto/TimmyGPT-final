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

// ======================
// CACHE
// ======================
const cache = new Map();

// ======================
// STREAMING EFFECT
// ======================
async function sendStreaming(msg, text) {
let output = "";
const message = await msg.reply("...");

for (let i = 0; i < text.length; i += 15) {
output += text.slice(i, i + 15);
await message.edit(output);
await new Promise(r => setTimeout(r, 40));
}
}

// ======================
// PLUGINS (IN 1 FILE)
// ======================

const plugins = [];

// ===== CRYPTO =====
plugins.push(async (msg, text) => {
if (!text.includes("btc") && !text.includes("bitcoin")) return false;

try {
const res = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
const price = res.data.bitcoin.usd;

```
const reply = "BTC: $" + price + " (CoinGecko)";
cache.set(text, reply);

await msg.reply(reply);
return true;
```

} catch {
try {
const res = await axios.get("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
const price = res.data.price;

```
  const reply = "BTC: $" + price + " (Binance)";
  await msg.reply(reply);
  return true;

} catch {
  await msg.reply("Crypto error");
  return true;
}
```

}
});

// ===== WEATHER =====
plugins.push(async (msg, text) => {
if (!text.startsWith("weer")) return false;

try {
const city = text.replace("weer", "").trim() || "amsterdam";

```
const res = await axios.get("https://wttr.in/" + city + "?format=3");

const reply = "Weather: " + res.data;
cache.set(text, reply);

await msg.reply(reply);
return true;
```

} catch {
await msg.reply("Weather error");
return true;
}
});

// ===== SEARCH =====
plugins.push(async (msg, text) => {
if (!text.startsWith("wat is") && !text.startsWith("wie is")) return false;

try {
const res = await axios.get("https://api.duckduckgo.com/", {
params: { q: text, format: "json" }
});

```
const answer = res.data.Abstract || "No info found";

await msg.reply(answer);
return true;
```

} catch {
await msg.reply("Search error");
return true;
}
});

// ===== AI =====
plugins.push(async (msg, text) => {
if (!text.startsWith("ai ")) return false;

try {
const prompt = text.replace("ai ", "");

```
const ai = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: prompt }],
  max_tokens: 300
});

const reply = ai.choices[0].message.content || "No response";

await sendStreaming(msg, reply);

return true;
```

} catch (err) {
console.error(err);
await msg.reply("AI error");
return true;
}
});

// ======================
// BOT CORE
// ======================

client.once('ready', () => {
console.log("BOT PRO ONLINE");
});

client.on('messageCreate', async (msg) => {
if (msg.author.bot) return;

const text = msg.content.toLowerCase();

console.log("INPUT:", text);

// CACHE
if (cache.has(text)) {
return msg.reply("Cached: " + cache.get(text));
}

// RUN PLUGINS
for (const plugin of plugins) {
const handled = await plugin(msg, text);
if (handled) return;
}

return msg.reply("Use: btc | weer <stad> | ai <vraag>");
});

client.login(process.env.DISCORD_TOKEN);
