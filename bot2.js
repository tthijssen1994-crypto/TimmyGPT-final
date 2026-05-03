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

if (text === "ping") {
return msg.reply("pong");
}

if (text === "btc") {
try {
const res = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
const price = res.data.bitcoin.usd;
return msg.reply("BTC: $" + price);
} catch (e) {
return msg.reply("error");
}
}

return msg.reply("ok");
});

client.login(process.env.DISCORD_TOKEN);
