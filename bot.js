const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const PREFIX = "!";

// ===== SAFE FETCH =====
async function safeFetch(url) {
  try {
    const res = await axios.get(url, { timeout: 5000 });
    return res.data;
  } catch {
    return null;
  }
}

// ===== CRYPTO (MULTI API) =====
async function getCrypto() {
  const cg = await safeFetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
  if (cg && cg.bitcoin) return "BTC: $" + cg.bitcoin.usd + " (CoinGecko)";

  const binance = await safeFetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
  if (binance && binance.price) return "BTC: $" + parseFloat(binance.price).toFixed(2) + " (Binance)";

  return "Crypto API error";
}

// ===== WEATHER (MULTI API) =====
async function getWeather(city) {
  const wttr = await safeFetch("https://wttr.in/" + city + "?format=j1");
  if (wttr && wttr.current_condition) {
    const w = wttr.current_condition[0];
    return city + ": " + w.temp_C + "°C, " + w.weatherDesc[0].value;
  }

  const open = await safeFetch("https://api.open-meteo.com/v1/forecast?latitude=52.37&longitude=4.89&current_weather=true");
  if (open && open.current_weather) {
    return city + ": " + open.current_weather.temperature + "°C (Open-Meteo)";
  }

  return "Weather API error";
}

// ===== AI MOCK =====
async function getAI(text) {
  return "AI: " + text;
}

// ===== STREAMING =====
async function stream(message, text) {
  let msg = await message.reply("...");
  let current = "";

  for (let i = 0; i < text.length; i++) {
    current += text[i];
    if (i % 4 === 0) {
      await msg.edit(current);
      await new Promise(r => setTimeout(r, 15));
    }
  }

  await msg.edit(current);
}

function startBot() {
  client.once('ready', () => {
    console.log("PRO BOT ONLINE");
  });

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(1).split(" ");
    const cmd = args[0];

    try {
      if (cmd === "ping") return message.reply("pong");

      if (cmd === "crypto") {
        const data = await getCrypto();
        return message.reply(data);
      }

      if (cmd === "weer") {
        const city = args[1] || "Amsterdam";
        const data = await getWeather(city);
        return message.reply(data);
      }

      if (cmd === "ai") {
        const input = args.slice(1).join(" ");
        const res = await getAI(input);
        return stream(message, res);
      }

      if (cmd === "help") {
        return message.reply("Commands: !ping !crypto !weer !ai");
      }

    } catch (err) {
      console.error(err);
      message.reply("Error");
    }
  });

  client.login(process.env.TOKEN);
}

module.exports = { startBot };
