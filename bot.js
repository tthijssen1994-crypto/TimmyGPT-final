const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// simpele rate limit
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

// simpele cache
const cache = new Map();

client.once('ready', () => {
console.log(`🚀 Online als ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
if (msg.author.bot) return;

const user = msg.author.id;
const text = msg.content.toLowerCase();

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
return msg.reply(`💰 Bitcoin prijs: $${price}`);
} catch {
return msg.reply("❌ Crypto fout");
}
}

// 🌦️ WEER
if (text.includes("weer")) {
try {
const city = text.split("weer in")[1]?.trim() || "Amsterdam";
const res = await axios.get(`https://wttr.in/${city}?format=3`);
return msg.reply(`🌦️ ${res.data}`);
} catch {
return msg.reply("❌ Weer fout");
}
}

// 🔎 SEARCH
if (text.includes("wat is") || text.includes("wie is")) {
try {
const res = await axios.get("https://api.duckduckgo.com/", {
params: { q: text, format: "json", no_html: 1 }
});

```
  const answer = res.data.Abstract || "Geen info gevonden.";
  cache.set(text, answer);

  return msg.reply(answer);
} catch {
  return msg.reply("❌ Zoek fout");
}
```

}

// 🤖 AI (zonder streaming voor stabiliteit)
try {
const reply = "🤖 AI antwoord op: " + text;

```
cache.set(text, reply);

return msg.reply(reply);
```

} catch {
return msg.reply("⚠️ AI fout");
}
});

client.login(process.env.DISCORD_TOKEN);
