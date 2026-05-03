const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

client.once('ready', () => {
console.log("✅ BOT2 ONLINE");
});

client.on('messageCreate', (msg) => {
if (msg.author.bot) return;

msg.reply("🔥 BOT2 WORKS");
});

client.login(process.env.DISCORD_TOKEN);
