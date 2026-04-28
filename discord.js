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

client.once('clientReady', () => {
  console.log(`🚀 Online als ${client.user.tag}`);
});

// 🎨 MENU UI
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

client.on('interactionCreate', async (interaction) => {

  // =====================
  // SLASH COMMANDS
  // =====================
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === 'menu') {
      return interaction.reply(menu());
    }

    if (interaction.commandName === 'ping') {
      return interaction.reply('🏓 Pong!');
    }
  }

  // =====================
  // BUTTONS
  // =====================
  if (interaction.isButton()) {

    const user = interaction.user.username;

    // 💬 OPEN MODAL
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
      const vraag = interaction.fields.getTextInputValue('vraag');

      await interaction.deferReply();

      const reply = await handleBotLogic(user, vraag);

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("💬 Antwoord")
            .setDescription(reply)
            .setColor(0x5865F2)
        ],
        components: [menu().components]
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);