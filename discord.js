const { Client, GatewayIntentBits } = require('discord.js');
const { handleBotLogic, resetMemory } = require('./botLogic');
const { getBitcoinPrice } = require('./crypto');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
  console.log(`Discord bot online als ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const user = interaction.user.username;

  // 🟢 PING
  if (interaction.commandName === 'ping') {
    return interaction.reply('🏓 Pong!');
  }

  // ❓ HELP
  if (interaction.commandName === 'help') {
    return interaction.reply(`
🤖 Commands:
/ask → stel een vraag
/price → crypto prijs
/reset → wis geheugen
/ping → check bot
    `);
  }

  // 🧠 RESET
  if (interaction.commandName === 'reset') {
    await resetMemory(user);
    return interaction.reply("🧠 Memory gereset!");
  }

  // 💰 PRICE
  if (interaction.commandName === 'price') {
    const coin = interaction.options.getString('coin');

    if (coin.toLowerCase().includes("bitcoin")) {
      const price = await getBitcoinPrice();
      return interaction.reply(price);
    }

    return interaction.reply("Alleen bitcoin ondersteund (voor nu)");
  }

  // 💬 ASK
  if (interaction.commandName === 'ask') {
    const vraag = interaction.options.getString('vraag');

    await interaction.deferReply(); // loading...
    const reply = await handleBotLogic(user, vraag);

    return interaction.editReply(reply);
  }
});

client.login(process.env.DISCORD_TOKEN);