const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

// ===== CONFIG =====
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const AUTO_CHANNEL_ID = process.env.AUTO_CHANNEL_ID;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

// ===== CLIENT =====
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

// ===== SLASH COMMANDS =====
const commands = [
    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check of bot werkt"),

    new SlashCommandBuilder()
        .setName("crypto")
        .setDescription("BTC prijs"),

    new SlashCommandBuilder()
        .setName("weer")
        .setDescription("Weer check")
        .addStringOption(opt =>
            opt.setName("stad")
                .setDescription("Welke stad?")
                .setRequired(true)
        )
].map(c => c.toJSON());

// ===== REGISTER COMMANDS =====
async function registerCommands() {
    if (!TOKEN || !CLIENT_ID) {
        console.log("❌ TOKEN of CLIENT_ID ontbreekt");
        return;
    }

    try {
        const rest = new REST({ version: "10" }).setToken(TOKEN);
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
        console.log("✅ Slash commands geladen");
    } catch (err) {
        console.error("❌ Command error:", err.message);
    }
}

// ===== CRYPTO (MULTI API) =====
async function getBTC() {
    try {
        const cg = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
        return `💰 BTC: $${cg.data.bitcoin.usd} (CoinGecko)`;
    } catch (e1) {
        try {
            const binance = await axios.get("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
            return `💰 BTC: $${parseFloat(binance.data.price).toFixed(2)} (Binance)`;
        } catch (e2) {
            return "❌ Crypto API down";
        }
    }
}

// ===== WEER (MULTI API) =====
async function getWeather(city) {
    try {
        const w1 = await axios.get(`https://wttr.in/${city}?format=j1`);
        return `🌤️ ${city}: ${w1.data.current_condition[0].temp_C}°C (wttr.in)`;
    } catch (e1) {
        try {
            const w2 = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=52&longitude=5&current_weather=true`);
            return `🌤️ ${city}: ${w2.data.current_weather.temperature}°C (Open-Meteo)`;
        } catch (e2) {
            return "❌ Weer API down";
        }
    }
}

// ===== OPENAI STREAM SIM =====
async function askAI(prompt, message) {
    if (!OPENAI_KEY) return "❌ Geen OpenAI key";

    try {
        const res = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }]
            },
            {
                headers: {
                    Authorization: `Bearer ${OPENAI_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        let text = res.data.choices[0].message.content;

        // fake streaming edit
        let sent = await message.reply("🤖...");
        let current = "";

        for (let i = 0; i < text.length; i += 20) {
            current += text.slice(i, i + 20);
            await sent.edit(current);
            await new Promise(r => setTimeout(r, 50));
        }

    } catch (err) {
        console.error(err.message);
        message.reply("❌ AI error");
    }
}

// ===== READY =====
client.once("clientReady", async () => {
    console.log(`🚀 Online als ${client.user.tag}`);
    await registerCommands();
});

// ===== SLASH HANDLER =====
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    try {
        if (interaction.commandName === "ping") {
            await interaction.reply("🏓 Pong!");
        }

        if (interaction.commandName === "crypto") {
            await interaction.reply(await getBTC());
        }

        if (interaction.commandName === "weer") {
            const stad = interaction.options.getString("stad");
            await interaction.reply(await getWeather(stad));
        }

    } catch (err) {
        console.error(err);
        interaction.reply("❌ Fout");
    }
});

// ===== AUTO AI CHANNEL =====
client.on("messageCreate", async message => {
    if (message.author.bot) return;

    if (message.channel.id === AUTO_CHANNEL_ID) {
        await askAI(message.content, message);
    }
});

// ===== START =====
client.login(TOKEN);