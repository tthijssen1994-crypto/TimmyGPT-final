const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const OpenAI = require("openai");

const client = new Client({
intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// 🔑 OpenAI
const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY,
});

// ⚡ cache
const cache = new Map();

// 🛡️ rate limit
const users = new Map();
function rateLimit(user) {
const now = Date.now();
if (!users.has(user)) users.set(user, []);
const timestamps = users.get(user).filter(t => now - t < 10000);
if (timestamps.length >= 5) return false;
timestamps.push(now);
users.set(user, timestamps);
return true;
}

client.once('ready', () => {
console.log(`🚀 Online als ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
if (msg.author.bot) return;

const user = msg.author.id;
const text = msg.content.toLowerCase();

console.log("INPUT:", text);

if (!rateLimit(user)) {
return msg.reply("⏳ Rustig aan...");
}

// ⚡ CACHE
if (cache.has(text)) {
return msg.reply("⚡ " + cache.get(text));
}

// 💰 CRYPTO
if (text.includes("bitcoin") || text.includes("btc")) {
try {
const res = await axios.get("https://api.coindesk.com/v1/bpi/currentprice.json");
const price = res.data.bpi.USD.rate;
const reply = `💰 Bitcoin prijs: $${price}`;
cache.set(text, reply);
return msg.reply(reply);
} catch {
return msg.reply("❌ Crypto fout");
}
}

// 🌦️ WEER
if (text.includes("weer")) {
try {
const city = text.split("weer in")[1]?.trim() || "Amsterdam";
const res = await axios.get(`https://wttr.in/${city}?format=3`);
const reply = `🌦️ ${res.data}`;
cache.set(text, reply);
return msg.reply(reply);
} catch {
return msg.reply("❌ Weer fout");
}
}

// 🔎 SEARCH (internet info)
if (text.includes("wat is") || text.includes("wie is") || text.includes("zoek")) {
try {
const res = await axios.get("https://api.duckduckgo.com/", {
params: {
q: text,
format: "json",
no_html: 1
}
});

```
  const answer = res.data.Abstract || "Geen duidelijke info gevonden.";
  cache.set(text, answer);
  return msg.reply(answer);
} catch {
  return msg.reply("❌ Zoek fout");
}
```

}

// 🤖 AI (ECHT)
try {
const ai = await openai.chat.completions.create({
model: "gpt-4o-mini",
messages: [
{
role: "system",
content: "Je bent een slimme, snelle AI en antwoordt in het Nederlands."
},
{
role: "user",
content: text
}
],
max_tokens: 300
});

```
let reply = ai.choices[0].message.content;

if (!reply) reply = "⚠️ Geen AI antwoord";

if (reply.length > 1900) {
  reply = reply.slice(0, 1900);
}

cache.set(text, reply);

return msg.reply(reply);
```

} catch (err) {
console.error(err);
return msg.reply("⚠️ AI fout");
}
});

client.login(process.env.DISCORD_TOKEN);
