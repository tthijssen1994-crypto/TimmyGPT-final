const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', () => {
console.log(`🚀 Online als ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
if (msg.author.bot) return;

const text = msg.content.toLowerCase();

// 💰 bitcoin
if (text.includes("bitcoin")) {
const res = await axios.get("https://api.coindesk.com/v1/bpi/currentprice.json");
return msg.reply(`💰 BTC: $${res.data.bpi.USD.rate}`);
}

// 🌦️ weer
if (text.includes("weer")) {
const res = await axios.get("https://wttr.in/?format=3");
return msg.reply(`🌦️ ${res.data}`);
}

// 🔎 search
if (text.includes("wat is")) {
return msg.reply("🤖 Simpele bot werkt nu!");
}

// fallback
return msg.reply("👋 Bot werkt!");
});

client.login(process.env.DISCORD_TOKEN);
