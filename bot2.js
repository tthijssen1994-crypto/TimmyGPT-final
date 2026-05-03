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

// simpele cache
const cache = new Map();

// simpele rate limit
const users = new Map();
function allow(user) {
const now = Date.now();
if (!users.has(user)) users.set(user, []);
const list = users.get(user).filter(t => now - t < 10000);
if (list.length > 5) return false;
list.push(now);
users.set(user, list);
return true;
}

client.once('ready', () => {
console.log("🚀 BOT2 PRO ONLINE");
});

client.on('messageCreate', async (msg) => {
if (msg.author.bot) return;

const text = msg.content.toLowerCase();
const user = msg.author.id;

console.log("INPUT:", text);

if (!allow(user)) {
return msg.reply("⏳ Rustig...");
}

// CACHE
if (cache.has(text)) {
return msg.reply("⚡ " + cache.get(text));
}

// 💰 CRYPTO
if (text.includes("bitcoin") || text.includes("btc")) {
const res = await axios.get("https://api.coindesk.com/v1/bpi/currentprice.json");
const price = res.data.bpi.USD.rate;
const reply = `💰 BTC: $${price}`;
cache.set(text, reply);
return msg.reply(reply);
}

// 🌦️ WEER
if (text.includes("weer")) {
const city = text.split("weer in")[1]?.trim() || "Amsterdam";
const res = await axios.get(`https://wttr.in/${city}?format=3`);
const reply = `🌦️ ${res.data}`;
cache.set(text, reply);
return msg.reply(reply);
}

// 🔎 SEARCH
if (text.includes("wat is") || text.includes("wie is")) {
const res = await axios.get("https://api.duckduckgo.com/", {
params: { q: text, format: "json" }
});

```
const answer = res.data.Abstract || "Geen info gevonden.";
cache.set(text, answer);
return msg.reply(answer);
```

}

// 🤖 AI
const ai = await openai.chat.completions.create({
model: "gpt-4o-mini",
messages: [
{
role: "system",
content: "Je bent een slimme Discord AI en antwoordt kort en duidelijk in het Nederlands."
},
{
role: "user",
content: text
}
],
max_tokens: 200
});

let reply = ai.choices[0].message.content || "⚠️ Geen antwoord";

if (reply.length > 1900) {
reply = reply.slice(0, 1900);
}

cache.set(text, reply);

return msg.reply(reply);
});

client.login(process.env.DISCORD_TOKEN);
