const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

client.once('ready', () => {
console.log("BOT ONLINE");
});

client.on('messageCreate', async (msg) => {
if (msg.author.bot) return;

const text = msg.content.toLowerCase();

// ===== BTC =====
if (text === "btc") {
try {
const res = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
const price = res.data.bitcoin.usd;
return msg.reply("BTC: $" + price);
} catch (e) {
return msg.reply("Crypto error");
}
}

// ===== WEATHER =====
if (text.startsWith("weer")) {
try {
const city = text.replace("weer", "").trim() || "amsterdam";
const res = await axios.get("https://wttr.in/" + city + "?format=3");
return msg.reply("Weather: " + res.data);
} catch (e) {
return msg.reply("Weather error");
}
}

// ===== DEFAULT =====
return msg.reply("Bot werkt");
});

client.login(process.env.DISCORD_TOKEN);
