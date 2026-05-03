const {
Client,
GatewayIntentBits,
EmbedBuilder
} = require('discord.js');

const { handleAIStream } = require('./ai');
const { rateLimit } = require('./rateLimiter');

// plugins
const crypto = require('./crypto');
const weather = require('./weather');
const search = require('./search');

const plugins = [crypto, weather, search];

function detectPlugin(message) {
return plugins.find(p => p.match(message));
}

function startBot() {
const client = new Client({
intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', () => {
console.log(`🚀 Online als ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
if (msg.author.bot) return;

```
const user = msg.author.id;
const text = msg.content;

// 🛡️ RATE LIMIT
if (!rateLimit(user)) {
  return msg.reply("⏳ Rustig aan, je gaat te snel...");
}

// 🔌 PLUGIN CHECK
const plugin = detectPlugin(text.toLowerCase());
if (plugin) {
  const result = await plugin.run(text);
  return msg.reply(result);
}

// 🤖 STREAMING AI
const replyMsg = await msg.reply("💬 Denken...");

await handleAIStream({
  user,
  message: text,
  onToken: async (partial) => {
    try {
      await replyMsg.edit(partial.slice(0, 1900));
    } catch {}
  }
});
```

});

client.login(process.env.DISCORD_TOKEN);
}

module.exports = { startBot };
