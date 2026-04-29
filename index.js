require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const { handleBotLogic, resetMemory } = require('./botLogic');
const { getBitcoinPrice } = require('./crypto');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// =====================
// READY
// =====================
client.once('ready', () => {
  console.log(`🚀 Online als ${client.user.tag}`);
});

// =====================
// MENU
// =====================
function menu() {
  return {
    embeds: [
      new EmbedBuilder()
        .setTitle("🤖 TimmyGPT PRO")
        .setDescription("Kies een optie 👇")
        .setColor(0x5865F2)
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ask').setLabel('💬 Vraag').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('price').setLabel('💰 Bitcoin').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('time').setLabel('🕒 Tijd').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('uptime').setLabel('⚡ Uptime').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('reset').setLabel('🧠 Reset').setStyle(ButtonStyle.Danger)
      )
    ]
  };
}

// =====================
// INTERACTIONS
// =====================
client.on('interactionCreate', async (interaction) => {

  // =====================
  // SLASH COMMANDS
  // =====================
  if (interaction.isChatInputCommand()) {

    const user = interaction.user.id;

    // 📋 MENU
    if (interaction.commandName === 'menu') {
      return interaction.reply(menu());
    }

    // 🏓 PING
    if (interaction.commandName === 'ping') {
      return interaction.reply('🏓 Pong!');
    }

    // 🤖 AI
    if (interaction.commandName === 'ask') {
      const vraag = interaction.options.getString('vraag');

      await interaction.reply("🧠 Even nadenken...");

      try {
        let reply = await handleBotLogic(user, vraag);

        // 🔥 FIXES
        if (!reply || typeof reply !== "string") {
          reply = "⚠️ Geen geldig antwoord";
        }

        if (reply.length > 1900) {
          reply = reply.slice(0, 1900) + "\n\n✂️ Ingekort...";
        }

        await interaction.editReply(reply);

      } catch (err) {
        console.error(err);
        await interaction.editReply("❌ Er ging iets mis...");
      }
    }

    // 🎵 FAKE HACK (FUN)
    if (interaction.commandName === 'hack') {
      const target = interaction.options.getString('user') || "doelwit";

      await interaction.reply("💻 Hacken gestart...");

      setTimeout(() => {
        interaction.editReply(`🔓 ${target} gehackt 😈 (grapje)`);
      }, 2000);
    }

    // 🎱 8BALL
    if (interaction.commandName === '8ball') {
      const antwoorden = [
        "Ja", "Nee", "Misschien", "Zeker", "Geen idee", "Vraag later opnieuw"
      ];
      const random = antwoorden[Math.floor(Math.random() * antwoorden.length)];
      return interaction.reply(`🎱 ${random}`);
    }

    // 🪙 COINFLIP
    if (interaction.commandName === 'coinflip') {
      const result = Math.random() > 0.5 ? "Kop 🪙" : "Munt 🪙";
      return interaction.reply(result);
    }

    // 🧠 RESET
    if (interaction.commandName === 'reset') {
      await resetMemory(user);
      return interaction.reply("🧠 Geheugen gewist!");
    }
  }

  // =====================
  // BUTTONS
  // =====================
  if (interaction.isButton()) {

    const user = interaction.user.id;

    // 💬 ASK MODAL
    if (interaction.customId === 'ask') {

      const modal = new ModalBuilder()
        .setCustomId('askModal')
        .setTitle('💬 Stel je vraag');

      const input = new TextInputBuilder()
        .setCustomId('vraag')
        .setLabel('Wat wil je weten?')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(input)
      );

      return interaction.showModal(modal);
    }

    // 💰 BITCOIN
    if (interaction.customId === 'price') {
      await interaction.deferReply({ ephemeral: true });

      const price = await getBitcoinPrice();

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("💰 Bitcoin prijs")
            .setDescription(price)
            .setColor(0xF7931A)
        ]
      });
    }

    // 🕒 TIJD
    if (interaction.customId === 'time') {
      return interaction.reply({
        content: `🕒 ${new Date().toLocaleString()}`,
        ephemeral: true
      });
    }

    // ⚡ UPTIME
    if (interaction.customId === 'uptime') {
      const uptime = Math.floor(process.uptime());
      return interaction.reply({
        content: `⚡ Uptime: ${uptime}s`,
        ephemeral: true
      });
    }

    // 🧠 RESET
    if (interaction.customId === 'reset') {
      await resetMemory(user);
      return interaction.reply({
        content: "🧠 Geheugen gereset!",
        ephemeral: true
      });
    }
  }

  // =====================
  // MODAL SUBMIT
  // =====================
  if (interaction.isModalSubmit()) {

    if (interaction.customId === 'askModal') {

      const user = interaction.user.id;
      const vraag = interaction.fields.getTextInputValue('vraag');

      await interaction.reply("🧠 Even nadenken...");

      try {
        let reply = await handleBotLogic(user, vraag);

        // 🔥 FIXES
        if (!reply || typeof reply !== "string") {
          reply = "⚠️ Geen geldig antwoord";
        }

        if (reply.length > 1900) {
          reply = reply.slice(0, 1900) + "\n\n✂️ Ingekort...";
        }

        await interaction.editReply({
          content: reply,
          components: [menu().components]
        });

      } catch (err) {
        console.error(err);
        await interaction.editReply("❌ Er ging iets mis...");
      }
    }
  }
});

// =====================
// LOGIN
// =====================
client.login(process.env.DISCORD_TOKEN);