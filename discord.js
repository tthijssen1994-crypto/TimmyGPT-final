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

client.once('ready', () => {
  console.log(`Discord bot online als ${client.user.tag}`);
});

// 🎛️ MENU
function mainMenu() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ask_modal')
      .setLabel('💬 Stel vraag')
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
  );
}

client.on('interactionCreate', async (interaction) => {

  // =====================
  // SLASH COMMANDS
  // =====================
  if (interaction.isChatInputCommand()) {

    const user = interaction.user.username;

    if (interaction.commandName === 'help') {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🤖 TimmyGPT")
            .setDescription("Gebruik de knoppen hieronder 👇")
            .setColor(0x5865F2)
        ],
        components: [mainMenu()]
      });
    }

    if (interaction.commandName === 'ping') {
      return interaction.reply("🏓 Pong!");
    }
  }

  // =====================
  // BUTTONS
  // =====================
  if (interaction.isButton()) {

    const user = interaction.user.username;

    // 💬 OPEN MODAL
    if (interaction.customId === 'ask_modal') {

      const modal = new ModalBuilder()
        .setCustomId('askModal')
        .setTitle('💬 Stel je vraag');

      const input = new TextInputBuilder()
        .setCustomId('vraagInput')
        .setLabel('Wat wil je weten?')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);

      return interaction.showModal(modal);
    }

    // 💰 PRICE
    if (interaction.customId === 'price') {
      const price = await getBitcoinPrice();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("💰 Bitcoin prijs")
            .setDescription(price)
            .setColor(0xF7931A)
        ],
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

    // ❓ HELP
    if (interaction.customId === 'help') {
      return interaction.reply({
        content: "Klik op 💬 om een vraag te stellen!",
        ephemeral: true
      });
    }
  }

  // =====================
  // MODAL SUBMIT
  // =====================
  if (interaction.isModalSubmit()) {

    if (interaction.customId === 'askModal') {

      const user = interaction.user.username;
      const vraag = interaction.fields.getTextInputValue('vraagInput');

      await interaction.deferReply();

      const reply = await handleBotLogic(user, vraag);

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("💬 Antwoord")
            .setDescription(reply)
            .setColor(0x5865F2)
        ],
        components: [mainMenu()]
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);