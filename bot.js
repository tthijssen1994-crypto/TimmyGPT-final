
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const CHAT_CHANNEL = process.env.CHAT_CHANNEL || null;

// ===== SAFE FETCH =====
async function safeFetch(url) {
  try {
    const res = await axios.get(url, { timeout: 5000 });
    return res.data;
  } catch {
    return null;
  }
}

// ===== PLUGIN SYSTEM =====
const plugins = [];

function registerPlugin(plugin) {
  plugins.push(plugin);
}

// ===== CRYPTO PLUGIN =====
registerPlugin({
  name: "crypto",
  trigger: (msg) => msg.includes("btc") || msg.includes("crypto"),
  run: async () => {
    const cg = await safeFetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
    if (cg?.bitcoin) return "BTC: $" + cg.bitcoin.usd + " (CoinGecko)";
    const binance = await safeFetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
    if (binance?.price) return "BTC: $" + parseFloat(binance.price).toFixed(2) + " (Binance)";
    return "Crypto API error";
  }
});

// ===== WEATHER PLUGIN =====
registerPlugin({
  name: "weather",
  trigger: (msg) => msg.includes("weer") || msg.includes("weather"),
  run: async (msg) => {
    const city = msg.split(" ")[1] || "Amsterdam";
    const wttr = await safeFetch("https://wttr.in/" + city + "?format=j1");
    if (wttr?.current_condition) {
      const w = wttr.current_condition[0];
      return city + ": " + w.temp_C + "°C, " + w.weatherDesc[0].value;
    }
    return "Weather API error";
  }
});

// ===== OPENAI STREAM (SIMULATED) =====
async function stream(message, text) {
  let current = "";
  const msg = await message.reply("...");

  for (let i = 0; i < text.length; i++) {
    current += text[i];
    if (i % 5 === 0) {
      await msg.edit(current);
      await new Promise(r => setTimeout(r, 15));
    }
  }

  await msg.edit(current);
}

// ===== SLASH COMMANDS =====
const commands = [
  {
    name: "ping",
    description: "Ping test"
  },
  {
    name: "ai",
    description: "Ask AI",
    options: [{
      name: "text",
      type: 3,
      description: "Your question",
      required: true
    }]
  }
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

// ===== REGISTER COMMANDS =====
async function registerCommands() {
  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log("Slash commands registered");
  } catch (err) {
    console.error(err);
  }
}

// ===== BOT =====
client.once('ready', async () => {
  console.log("V3 BOT ONLINE");
  await registerCommands();
});

// ===== MESSAGE AUTO AI =====
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // channel AI mode
  if (CHAT_CHANNEL && message.channel.id === CHAT_CHANNEL) {
    return stream(message, "AI antwoord: " + message.content);
  }

  // plugins auto detect
  for (const plugin of plugins) {
    if (plugin.trigger(content)) {
      try {
        const result = await plugin.run(content);
        return message.reply(result);
      } catch {
        return message.reply("Plugin error");
      }
    }
  }
});

// ===== SLASH HANDLER =====
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    return interaction.reply("pong");
  }

  if (interaction.commandName === "ai") {
    const text = interaction.options.getString("text");
    await interaction.reply("...");
    return stream(interaction, "AI: " + text);
  }
});

client.login(TOKEN);
