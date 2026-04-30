const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const { handleBotLogic, resetMemory } = require('./botLogic');
const { getBitcoinPrice } = require('./crypto');

const { DISCORD_TOKEN } = process.env;

const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds]
});

discordClient.once('ready', () => {
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
        .setStyle(TextInputStyle.Paragraph
