const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const { handleBotLogic, resetMemory } = require('./botLogic');
const { getBitcoinPrice } = require('./crypto');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Verander 'ready' naar 'clientReady' voor v15 van discord.js
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
        flags: [MessageFlags.Ephemeral] // Gebruik hier de juiste EPHEMERAL flag
      });
    }

    // 🧠 RESET
    if (interaction.customId === 'reset') {
      await resetMemory(user);

      return interaction.reply({
        content: "🧠 Geheugen gereset!",
        flags: [MessageFlags.Ephemeral] // Gebruik hier de juiste EPHEMERAL flag
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
        flags: [MessageFlags.Ephemeral] // Gebruik hier de juiste EPHEMERAL flag
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

      try {
        const reply = await handleBotLogic(user, vraag);

        // Hier geen componenten doorgeven om de "Invalid Form Body" fout te vermijden
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("💬 Antwoord")
              .setDescription(reply)
              .setColor(0x5865F2)
          ]
          // Verwijder de components uit de editReply om de fout te vermijden
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

client.login(process.env.DISCORD_TOKEN);
