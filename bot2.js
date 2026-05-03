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

// cache
const cache = new Map();

// rate limit
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
console.log("BOT ONLINE");
});

client.on('messageCreate', async (msg) => {
if (msg.author.bot) return;

const text = msg.content.toLowerCase();
const user = msg.author.id;

console.log("INPUT:", text);

if (!allow(user)) {
return msg.reply("Slow down");
}

// CACHE
if (cache.has(text)) {
return msg.reply("Cached: " + cache.get(text));
}

// ======================
// CRYPTO (MULTI API)
// ======================
if (text.includes("bitcoin") || text.includes("btc")) {

```
try {
  const res = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
  const price = res.data.bitcoin.usd;

  const reply = "BTC: $" + price + " (CoinGecko)";
  cache.set(text, reply);
  return msg.reply(reply);

} catch {

  try {
    const res = await axios.get("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
    const price = res.data.price;

    const reply = "BTC: $" + price + " (Binance)";
    cache.set(text, reply);
    return msg.reply(reply);

  } catch {

    try {
      const res = await axios.get("https://api.coinbase.com/v2/prices/spot?currency=USD");
      const price = res.data.data.amount;

      const reply = "BTC: $" + price + " (Coinbase)";
      cache.set(text, reply);
      return msg.reply(reply);

    } catch {
      return msg.reply("All crypto APIs failed");
    }
  }
}
```

}

// ======================
// WEATHER (MULTI API)
// ======================
if (text.includes("weer")) {
const city = text.split("weer in")[1]?.trim() || "Amsterdam";

```
try {
  const res = await axios.get("https://wttr.in/" + city + "?format=3");

  const reply = "Weather: " + res.data;
  cache.set(text, reply);
  return msg.reply(reply);

} catch {

  try {
    const geo = await axios.get("https://geocoding-api.open-meteo.com/v1/search?name=" + city);
    const lat = geo.data.results[0].latitude;
    const lon = geo.data.results[0].longitude;

    const weather = await axios.get(
      "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&current_weather=true"
    );

    const temp = weather.data.current_weather.temperature;

    const reply = "Weather " + city + ": " + temp + "C";
    cache.set(text, reply);
    return msg.reply(reply);

  } catch {
    return msg.reply("Weather APIs failed");
  }
}
```

}

// ======================
// SEARCH
// ======================
if (text.includes("wat is") || text.includes("wie is")) {
try {
const res = await axios.get("https://api.duckduckgo.com/", {
params: { q: text, format: "json" }
});

```
  const answer = res.data.Abstract || "No info found";
  cache.set(text, answer);
  return msg.reply(answer);

} catch {
  return msg.reply("Search error");
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
{
role: "system",
content: "You are a smart Discord AI. Answer short and clear."
},
{
role: "user",
content: text
}
],
max_tokens: 200
});

```
let reply = ai.choices[0].message.content || "No response";

if (reply.length > 1900) {
  reply = reply.slice(0, 1900);
}

cache.set(text, reply);

return msg.reply(reply);
```

} catch (err) {
console.error(err);
return msg.reply("AI error");
}
});

client.login(process.env.DISCORD_TOKEN);
