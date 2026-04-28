const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('clientReady', () => {
  console.log(`🚀 ONLINE als ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {

  console.log("👉 Interaction:", interaction.commandName);

  if (!interaction.isChatInputCommand()) return;

  // 🏓 TEST
  if (interaction.commandName === 'ping') {
    return interaction.reply('🏓 Pong werkt!');
  }

  // 📱 MENU
  if (interaction.commandName === 'menu') {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🤖 TimmyGPT")
          .setDescription("Bot werkt! 🎉")
          .setColor(0x5865F2)
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('test')
            .setLabel('Klik mij')
            .setStyle(ButtonStyle.Primary)
        )
      ]
    });
  }

});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'test') {
    return interaction.reply({ content: "🔥 Button werkt!", ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);