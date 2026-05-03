const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => {
console.log("✅ BOT WERKT");
});

client.on('messageCreate', (msg) => {
if (msg.author.bot) return;

msg.reply("🔥 WORKING");
});

client.login(process.env.DISCORD_TOKEN);
