const { Telegraf } = require('telegraf');
const { handleBotLogic, resetMemory } = require('./botLogic');
const { getBitcoinPrice } = require('./crypto');
const { searchInternet } = require('./search');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// 🚀 START
bot.start((ctx) => {
  ctx.reply(`
🤖 Welkom bij TimmyGPT!

Gebruik:
/ask vraag → stel een vraag
/price bitcoin → crypto prijs
/search onderwerp → zoek op internet
/reset → wis geheugen
/help → hulp
`);
});

// 💬 ASK (ChatGPT-style)
bot.command('ask', async (ctx) => {
  const user = ctx.from.username || ctx.from.id;
  const input = ctx.message.text.replace('/ask ', '');

  const thinkingMsg = await ctx.reply("🤔 Even nadenken...");

  try {
    const reply = await handleBotLogic(user, input);

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      thinkingMsg.message_id,
      null,
      reply
    );
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Er ging iets mis.");
  }
});

// 💰 PRICE
bot.command('price', async (ctx) => {
  const input = ctx.message.text.toLowerCase();

  if (input.includes("bitcoin") || input.includes("btc")) {
    const price = await getBitcoinPrice();
    return ctx.reply(price);
  }

  ctx.reply("Gebruik: /price bitcoin");
});

// 🔎 SEARCH
bot.command('search', async (ctx) => {
  const input = ctx.message.text.replace('/search ', '');

  const thinkingMsg = await ctx.reply("🔎 Zoeken...");

  try {
    const result = await searchInternet(input);

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      thinkingMsg.message_id,
      null,
      result
    );
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Kon niet zoeken.");
  }
});

// 🧠 RESET
bot.command('reset', async (ctx) => {
  const user = ctx.from.username || ctx.from.id;
  await resetMemory(user);
  ctx.reply("🧠 Geheugen gereset!");
});

// 🟢 PING
bot.command('ping', (ctx) => {
  ctx.reply("🏓 Pong! Bot werkt.");
});

// ❓ HELP
bot.command('help', (ctx) => {
  ctx.reply(`
🤖 Commands:

/ask vraag → stel een vraag
/price bitcoin → crypto prijs
/search onderwerp → zoek info
/reset → wis geheugen
/ping → check bot
/help → dit menu
`);
});

// 💬 NORMAAL CHATGEDRAG (zonder /ask)
bot.on('text', async (ctx) => {
  const user = ctx.from.username || ctx.from.id;
  const input = ctx.message.text;

  const thinkingMsg = await ctx.reply("💭...");

  try {
    const reply = await handleBotLogic(user, input);

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      thinkingMsg.message_id,
      null,
      reply
    );
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Error.");
  }
});

// 🚀 START BOT
bot.launch({
  dropPendingUpdates: true
});

console.log("Telegram bot draait netjes ✨");

// 🔒 graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));