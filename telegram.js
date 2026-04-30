const { Telegraf } = require('telegraf');

// Gebruik je GitHub Secret om de token op te halen
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Wanneer iemand /start stuurt, reageert de bot met een welkom bericht
bot.start((ctx) => {
  console.log('Bot is gestart en reageert op /start'); // Logbericht toegevoegd
  ctx.reply("Hallo, ik ben TimmyGPT! De bot werkt nu!");
});

// Start de bot
bot.launch()
  .then(() => console.log("Bot gestart!"))
  .catch((err) => {
    console.error("Fout bij starten bot:", err);
    process.exit(1);  // Stop het proces als de bot niet kan starten
  });

// 🚀 START MENU MET BUTTONS
bot.start((ctx) => {
  ctx.reply(
    "🤖 Welkom bij TimmyGPT!",
    Markup.inlineKeyboard([
      [Markup.button.callback("💬 Vraag stellen", "ASK")],
      [Markup.button.callback("💰 Bitcoin prijs", "PRICE")],
      [Markup.button.callback("🔎 Zoek iets", "SEARCH")],
      [Markup.button.callback("🧠 Reset geheugen", "RESET")]
    ])
  );
});

// 🎛️ BUTTON ACTIONS

bot.action("ASK", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply("Typ je vraag:");
});

bot.action("PRICE", async (ctx) => {
  await ctx.answerCbQuery();
  const price = await getBitcoinPrice();
  await streamReply(ctx, price);
});

bot.action("SEARCH", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply("Wat wil je zoeken?");
});

bot.action("RESET", async (ctx) => {
  await ctx.answerCbQuery();
  const user = ctx.from.username || ctx.from.id;
  await resetMemory(user);
  ctx.reply("🧠 Geheugen gereset!");
});

// 💬 /ask COMMAND
bot.command('ask', async (ctx) => {
  const user = ctx.from.username || ctx.from.id;
  const input = ctx.message.text.replace('/ask ', '');

  try {
    const reply = await handleBotLogic(user, input);
    await streamReply(ctx, reply);
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Er ging iets mis.");
  }
});

// 💰 /price COMMAND
bot.command('price', async (ctx) => {
  const input = ctx.message.text.toLowerCase();

  if (input.includes("bitcoin") || input.includes("btc")) {
    const price = await getBitcoinPrice();
    return streamReply(ctx, price);
  }

  ctx.reply("Gebruik: /price bitcoin");
});

// 🔎 /search COMMAND
bot.command('search', async (ctx) => {
  const input = ctx.message.text.replace('/search ', '');

  try {
    const result = await searchInternet(input);
    await streamReply(ctx, result);
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Kon niet zoeken.");
  }
});

// 🧠 /reset COMMAND
bot.command('reset', async (ctx) => {
  const user = ctx.from.username || ctx.from.id;
  await resetMemory(user);
  ctx.reply("🧠 Geheugen gereset!");
});

// 🟢 /ping
bot.command('ping', (ctx) => {
  ctx.reply("🏓 Pong!");
});

// ❓ /help
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

// 💬 NORMAAL CHATGEDRAG
bot.on('text', async (ctx) => {
  const user = ctx.from.username || ctx.from.id;
  const input = ctx.message.text;

  // voorkom dubbele trigger met commands
  if (input.startsWith('/')) return;

  try {
    const reply = await handleBotLogic(user, input);
    await streamReply(ctx, reply);
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Error.");
  }
});

// 🚀 START BOT (FIX voor dubbele berichten)
bot.launch({
  dropPendingUpdates: true
});

console.log("Telegram bot draait met UI + streaming ✨");

// 🔒 netjes afsluiten
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
