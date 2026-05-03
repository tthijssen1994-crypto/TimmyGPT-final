require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const TelegramBot = require("node-telegram-bot-api");
const OpenAI = require("openai");

// ===== ENV =====
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

const AI_CHANNEL = "ai-chat";

// ===== CLIENTS =====
const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const openai = new OpenAI({
  apiKey: OPENAI_KEY,
});

// ===== LANGUAGE DETECTION =====
function detectLanguage(text) {
  if (!text) return "nl";

  const lower = text.toLowerCase();

  if (lower.match(/\b(hello|hi|how|what|why|the|and)\b/)) return "en";
  if (lower.match(/\b(hallo|hoe|wat|waarom|de|het|een)\b/)) return "nl";
  if (lower.match(/\b(hola|como|que|por)\b/)) return "es";
  if (lower.match(/\b(bonjour|comment|quoi|pourquoi)\b/)) return "fr";

  return "nl"; // default
}

// ===== SYSTEM PROMPT =====
function buildPrompt(userText) {
  const lang = detectLanguage(userText);

  const system = {
    nl: "Je bent een slimme AI assistant. Antwoord altijd in het Nederlands, tenzij de gebruiker duidelijk een andere taal gebruikt.",
    en: "You are a smart AI assistant. Respond in English.",
    es: "Eres un asistente de IA inteligente. Responde en español.",
    fr: "Tu es un assistant IA intelligent. Réponds en français."
  };

  return [
    { role: "system", content: system[lang] || system.nl },
    { role: "user", content: userText }
  ];
}

// ===== AI STREAM =====
async function streamAI(promptMessages, onChunk) {
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: promptMessages,
      stream: true,
    });

    for await (const part of stream) {
      const text = part.choices[0]?.delta?.content;
      if (text) onChunk(text);
    }
  } catch (err) {
    console.error("AI ERROR:", err);
    onChunk("\n❌ AI error");
  }
}

// ===== TELEGRAM AUTO RECONNECT =====
let telegram = null;

async function startTelegram() {
  if (!TELEGRAM_TOKEN) {
    console.log("⚠️ Telegram uitgeschakeld (geen token)");
    return;
  }

  try {
    // 🧹 Force cleanup oude sessions
    const axios = require("axios");

    await axios.get(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteWebhook`);

    console.log("🧹 Oude Telegram sessies opgeschoond");

    // 🚀 Start bot (maar 1x!)
    telegram = new TelegramBot(TELEGRAM_TOKEN, {
      polling: {
        autoStart: true,
        interval: 1000,
        params: {
          timeout: 10
        }
      }
    });

    console.log("📱 Telegram bot gestart");

    telegram.on("message", async (msg) => {
      try {
        const chatId = msg.chat.id;
        const text = msg.text;
        if (!text) return;

        let full = "";
        const messages = buildPrompt(text);

        const sent = await telegram.sendMessage(chatId, "💭 Denken...");

        await streamAI(messages, async (chunk) => {
          full += chunk;

          if (full.length % 50 === 0) {
            try {
              await telegram.editMessageText(full.slice(0, 4000), {
                chat_id: chatId,
                message_id: sent.message_id,
              });
            } catch {}
          }
        });

        await telegram.editMessageText(full.slice(0, 4000), {
          chat_id: chatId,
          message_id: sent.message_id,
        });

      } catch (err) {
        console.error("Telegram message error:", err);
      }
    });

    telegram.on("polling_error", (err) => {
      console.error("Telegram polling error:", err.message);

      // ❌ GEEN reconnect loop meer!
      if (err.message.includes("409")) {
        console.log("⚠️ Meerdere bot instanties actief → fix Railway scaling");
      }
    });

  } catch (err) {
    console.error("Telegram start error:", err);
  }
}

// ===== DISCORD =====
discord.once("clientReady", () => {
  console.log("🤖 Discord bot online");
});

discord.on("messageCreate", async (msg) => {
  try {
    if (msg.author.bot) return;
    if (msg.channel.name !== chatgpt-kanaal) return;

    let full = "";
    const messages = buildPrompt(msg.content);

    let reply = await msg.reply("💭 Denken...");

    await streamAI(messages, async (chunk) => {
      full += chunk;

      if (full.length % 50 === 0) {
        try {
          await reply.edit(full.slice(0, 1900));
        } catch {}
      }
    });

    await reply.edit(full.slice(0, 1900));

  } catch (err) {
    console.error("Discord error:", err);
  }
});

// ===== START =====
discord.login(DISCORD_TOKEN);
startTelegram();