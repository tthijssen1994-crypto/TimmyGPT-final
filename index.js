// Discord bot configuratie
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const { Telegraf } = require('telegraf'); // Telegram bot
const { handleBotLogic, resetMemory } = require('./botLogic');
const { getBitcoinPrice } = require('./crypto');

// Omgevingsvariabelen
const { TELEGRAM_TOKEN, DISCORD_TOKEN } = process.env;

// ----------------------------------------
// Discord bot configuratie
// ----------------------------------------
const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds]
});

discordClient.once('clientReady', () => {
  console.log(`🚀 Discord bot online als ${discordClient.user.tag}`);
});

// 🎨 MENU UI voor Discord
function menu() {
  return {
    embeds: [
      new EmbedBuilder()
        .setTitle("🤖 TimmyGPT")
        .setDescription("Klik op een knop 👇")
        .setColor(0x5865F2)
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ask')
          .setLabel('💬 Vraag')
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId('price')
          .setLabel('💰 Bitcoin')
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId('reset')
          .setLabel('🧠 Reset')
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId('help')
          .setLabel('❓ Help')
          .setStyle(ButtonStyle.Secondary)
      )
    ]
  };
}

// Discord bot event: interactionCreate
discordClient.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'menu') {
      return interaction.reply(menu());
    }

    if (interaction.commandName === 'ping') {
      return interaction.reply('🏓 Pong!');
    }
  }

  if (interaction.isButton()) {
    const user = interaction.user.username;

    if (interaction.customId === 'ask') {
      const modal = new ModalBuilder()
        .setCustomId('askModal')
        .setTitle('💬 Stel je vraag');

      const input = new TextInputBuilder()
        .setCustomId('vraag')
        .setLabel('Wat wil je weten?')
        .setStyle(TextInputStyle.Paragraph) // Correcte haakje toegevoegd
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(input)
      );

      return interaction.showModal(modal);
    }

    if (interaction.customId === 'price') {
      const price = await getBitcoinPrice();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("💰 Bitcoin prijs")
            .setDescription(price)
            .setColor(0xF7931A)
        ],
        flags: MessageFlags.Ephemeral
      });
    }

    if (interaction.customId === 'reset') {
      await resetMemory(user);

      return interaction.reply({
        content: "🧠 Geheugen gereset!",
        flags: MessageFlags.Ephemeral
      });
    }

    if (interaction.customId === 'help') {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❓ Help")
            .setDescription(`
💬 Vraag → stel een vraag  
💰 Bitcoin → prijs  
🧠 Reset → wis geheugen  
            `)
            .setColor(0x00AE86)
        ],
        flags: MessageFlags.Ephemeral
      });
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'askModal') {
      const user = interaction.user.username;
      const vraag = interaction.fields.getTextInputValue('vraag');

      await interaction.deferReply();

      try {
        const reply = await handleBotLogic(user, vraag);

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("💬 Antwoord")
              .setDescription(reply)
              .setColor(0x5865F2)
          ]
        });
      } catch (error) {
        console.error("Error while processing modal:", error);
        await interaction.editReply({
          content: "Er ging iets mis, probeer het later opnieuw.",
        });
      }
    }
  }
});

// Log in de Discord bot
discordClient.login(DISCORD_TOKEN);

// ----------------------------------------
// Telegram bot configuratie
// ----------------------------------------
const telegramBot = new Telegraf(TELEGRAM_TOKEN);

// **Verwijder de Webhook expliciet**
telegramBot.telegram.deleteWebhook().then(() => {
  console.log('Webhook succesvol verwijderd!');
  return telegramBot.telegram.getWebhookInfo(); // Controleer of het gelukt is
}).then((info) => {
  console.log('Webhook info:', info); // Webhook info tonen voor controle
}).catch((err) => {
  console.error('Fout bij verwijderen van de webhook:', err); // Als er iets misgaat, laat het ons weten
});

// Telegram bot start actie
telegramBot.start((ctx) => {
  ctx.reply("🤖 Welkom bij TimmyGPT op Telegram! Gebruik de knoppen hieronder om interactie te hebben:", Markup.inlineKeyboard([
    [Markup.button.callback("💬 Vraag stellen", "ASK")],
    [Markup.button.callback("💰 Bitcoin prijs", "PRICE")],
    [Markup.button.callback("🧠 Reset geheugen", "RESET")],
    [Markup.button.callback("❓ Help", "HELP")]
  ]));
  console.log("Telegram bot gestart!");
});

// Telegram actie voor knoppen
telegramBot.action('ASK', (ctx) => {
  ctx.reply("Typ je vraag:");
});

telegramBot.action('PRICE', async (ctx) => {
  const price = await getBitcoinPrice();
  ctx.reply(price);
});

telegramBot.action('RESET', async (ctx) => {
  const user = ctx.from.username || ctx.from.id;
  await resetMemory(user);
  ctx.reply("🧠 Geheugen gereset!");
});

// Telegram command /ask
telegramBot.command('ask', async (ctx) => {
  const user = ctx.from.username || ctx.from.id;
  const input = ctx.message.text.replace('/ask ', '');

  try {
    const reply = await handleBotLogic(user, input);
    ctx.reply(reply);
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Er ging iets mis.");
  }
});

// Telegram command /price
telegramBot.command('price', async (ctx) => {
  const input = ctx.message.text.toLowerCase();
  if (input.includes("bitcoin") || input.includes("btc")) {
    const price = await getBitcoinPrice();
    return ctx.reply(price);
  }

  ctx.reply("Gebruik: /price bitcoin");
});

// Telegram command /reset
telegramBot.command('reset', async (ctx) => {
  const user = ctx.from.username || ctx.from.id;
  await resetMemory(user);
  ctx.reply("🧠 Geheugen gereset!");
});

// Telegram command /help
telegramBot.command('help', (ctx) => {
  ctx.reply(`
🤖 Commands:

/ask vraag → stel een vraag
/price bitcoin → crypto prijs
/reset → wis geheugen
/ping → check bot
/help → dit menu
`);
});

// Telegram bot starten in polling-modus
telegramBot.launch({
  polling: { timeout: 50, long_polling: true }
}).then(() => {
  console.log('Telegram bot draait nu in polling-modus!');
}).catch((err) => {
  console.error('Fout bij het starten van de bot in polling-modus:', err);
});

console.log("Telegram bot draait!");

// 🔒 netjes afsluiten
process.once('SIGINT', () => telegramBot.stop('SIGINT'));
process.once('SIGTERM', () => telegramBot.stop('SIGTERM'));
