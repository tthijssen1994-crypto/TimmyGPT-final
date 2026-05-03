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

// ===== CACHE =====
if (cache.has(text)) {
return msg.reply("Cached: " + cache.get(text));
}

// ===== HELP =====
if (text === "help") {
return msg.reply(
"Commands:\n" +
"btc -> bitcoin prijs\n" +
"weer amsterdam -> weer\n" +
"ai <vraag> -> AI antwoord"
);
}

// ===== BTC =====
if (text === "btc") {
try {
const res = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
const price = res.data.bitcoin.usd;

```
  const reply = "BTC: $" + price;
  cache.set(text, reply);

  return msg.reply(reply);
} catch {
  return msg.reply("Crypto error");
}
```

}

// ===== WEATHER =====
if (text.startsWith("weer")) {
try {
const city = text.replace("weer", "").trim() || "amsterdam";
const res = await axios.get("https://wttr.in/" + city + "?format=3");

```
  const reply = "Weather: " + res.data;
  cache.set(text, reply);

  return msg.reply(reply);
} catch {
  return msg.reply("Weather error");
}
```

}

// ===== AI =====
if (text.startsWith("ai ")) {
try {
const prompt = text.replace("ai ", "");

```
  const ai = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "user", content: prompt }
    ],
    max_tokens: 200
  });

  const reply = ai.choices[0].message.content || "No response";
  cache.set(text, reply);

  return msg.reply(reply);

} catch (err) {
  console.error(err);
  return msg.reply("AI error");
}
```

}

// ===== DEFAULT =====
return msg.reply("Gebruik 'help' voor commands");
});

client.login(process.env.DISCORD_TOKEN);
