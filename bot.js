require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const TelegramBot = require("node-telegram-bot-api");
const OpenAI = require("openai");

// ===== CONFIG =====
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

const AI_CHANNEL_NAME = "ai-chat"; // Discord kanaal naam

// ===== CLIENTS =====
const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const telegram = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const openai = new OpenAI({
  apiKey: OPENAI_KEY,
});

// ===== AI FUNCTION (ECHTE STREAMING) =====
async function streamAI(prompt, onChunk) {
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
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

// ===== DISCORD =====
discord.once("clientReady", () => {
  console.log("🤖 Discord bot online");
});

discord.on("messageCreate", async (msg) => {
  try {
    if (msg.author.bot) return;

    // Alleen reageren in specifiek kanaal
    if (msg.channel.name !== AI_CHANNEL_NAME) return;

    let reply = await msg.reply("💭 Thinking...");
    let full = "";

    await streamAI(msg.content, async (chunk) => {
      full += chunk;

      // Update message elke ~1s
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

// ===== TELEGRAM =====
telegram.on("message", async (msg) => {
  try {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    let full = "";

    const sent = await telegram.sendMessage(chatId, "💭 Thinking...");

    await streamAI(text, async (chunk) => {
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
    console.error("Telegram error:", err);
  }
});

// ===== START =====
discord.login(DISCORD_TOKEN);