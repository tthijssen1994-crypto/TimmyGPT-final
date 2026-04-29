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

require('dotenv').config();

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
        .setTitle("🤖 TimmyGPT+")
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
// MOCK AI (VEILIG & SNEL)
// =====================
async function smartReply(user, vraag) {
  try {
    // simpele slimme responses (geen API nodig)
    if (vraag.toLowerCase().includes("tijd")) {
      return `🕒 Het is ${new Date().toLocaleTimeString()}`;
    }

    if (vraag.toLowerCase().includes("naam")) {
      return `👤 Jij bent ${user}`;
    }

    if (vraag.length < 3) {
      return "🤔 Stel een iets duidelijkere vraag...";
    }

    // fallback AI-style response
    return `💡 Interessante vraag: "${vraag}"\n\nIk ben nog in ontwikkeling, maar ik leer snel 😄`;

  } catch (err) {
    console.error(err);
    return "❌ AI error";
  }
}

// =====================
// BITCOIN (VEILIG)
// =====================
async function getBitcoinPrice() {
  try {
    const res = await fetch("https://api.coindesk.com/v1/bpi/currentprice/EUR.json");
    const data = await res.json();
    return `€ ${data.bpi.EUR.rate}`;
  } catch {
    return "❌ Kon prijs niet ophalen";
  }
}

// =====================
// INTERACTIONS
// =====================
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

    // 💬 ASK
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
      return interaction.reply({
        content: "🧠 Geheugen gereset!",
        ephemeral: true
      });
    }
  }

  // =====================
  // MODAL
  // =====================
  if (interaction.isModalSubmit()) {

    if (interaction.customId === 'askModal') {

      const user = interaction.user.username;
      const vraag = interaction.fields.getTextInputValue('vraag');

      await interaction.deferReply();

      try {
        const reply = await smartReply(user, vraag);

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("💬 Antwoord")
              .setDescription(reply)
              .setColor(0x5865F2)
          ],
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