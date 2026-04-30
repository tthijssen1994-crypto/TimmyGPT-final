const { Telegraf, Markup } = require('telegraf');
const { handleBotLogic, resetMemory } = require('./botLogic');
const { getBitcoinPrice } = require('./crypto');

// Telegram bot configuratie
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// ✨ STREAMING EFFECT (gebruikt voor langere antwoorden)
async function streamReply(ctx, text) {
  const chunks = text.match(/.{1,50}/g) || [text];
  let current = "";

  const msg = await ctx.reply("💭...");

  for (const chunk of chunks) {
    current += chunk;
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      msg.message_id,
      null,
      current
    );
    await new Promise(r => setTimeout(r, 80)); // Typ effect
  }
}

// 🚀 Verwijder Webhook als die ingesteld is en zet bot in polling modus
bot.telegram.deleteWebhook()
  .then(() => {
    console.log('Webhook verwijderd, bot draait nu in polling modus');
  })
  .catch(err => {
    console.error('Fout bij verwijderen van webhook:', err);
  });

// 🚀 START MENU MET BUTTONS
bot.start((ctx) => {
  ctx.reply(
    "🤖 Welkom bij TimmyGPT! Gebruik de knoppen hieronder om interactie te hebben met de bot.",
    Markup.inlineKeyboard([
      [Markup.button.callback("💬 Vraag stellen", "ASK")],
      [Markup.button.callback("💰 Bitcoin prijs", "PRICE")],
      [Markup.button.callback("🔎 Zoek iets", "SEARCH")],
      [Markup.button.callback("🧠 Reset geheugen", "RESET")],
      [Markup.button.callback("👋 Hallo", "HELLO")],
      [Markup.button.callback("ℹ️ Info", "INFO")],
      [Markup.button.callback("💬 Quote", "QUOTE")],
      [Markup.button.callback("😂 Joke", "JOKE")],
      [Markup.button.callback("❓ Help", "HELP")]
    ])
  );
  console.log("Telegram bot gestart!");
});

// 🎛️ BUTTON ACTIONS
bot.action("ASK", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply("Typ je vraag:");
});

bot.action("PRICE", async (ctx) => {
  const price = await getBitcoinPrice();
  await streamReply(ctx, price);
});

bot.action("SEARCH", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply("Wat wil je zoeken?");
});

bot.action("RESET", async (ctx) => {
  const user = ctx.from.username || ctx.from.id;
  await resetMemory(user);
  ctx.reply("🧠 Geheugen gereset!");
});

bot.action("HELLO", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply("👋 Hallo! Hoe kan ik je helpen?");
});

bot.action("INFO", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply("🤖 Ik ben TimmyGPT, een veelzijdige bot die kan antwoorden geven, prijzen tonen, zoeken op internet en meer!");
});

bot.action("QUOTE", async (ctx) => {
  const quotes = [
    "Het leven is wat je gebeurt terwijl je andere plannen maakt. - John Lennon",
    "Wees de verandering die je in de wereld wilt zien. - Mahatma Gandhi",
    "Het enige wat je kunt controleren is hoe je reageert op wat er gebeurt. - Epictetus"
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  ctx.reply(`💬 Inspirerende quote: "${randomQuote}"`);
});

bot.action("JOKE", async (ctx) => {
  const jokes = [
    "Waarom kunnen geheimagenten nooit goed schaken? Omdat ze altijd bang zijn voor de loper.",
    "Waarom liep de computer naar de dokter? Omdat hij een virus had!",
    "Wat zegt een Git-commando tegen de programmeur? Git commit, Git push!"
  ];

  const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
  ctx.reply(`😂 Grappige mop: "${randomJoke}"`);
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
    return await streamReply(ctx, price);
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

// 🟢 /ping COMMAND
bot.command('ping', (ctx) => {
  ctx.reply("🏓 Pong!");
});

// ❓ /help COMMAND
bot.command('help', (ctx) => {
  ctx.reply(`
🤖 Commands:

/ask vraag → stel een vraag
/price bitcoin → crypto prijs
/search onderwerp → zoek info
/reset → wis geheugen
/hello → begroeting
/info → informatie over de bot
/quote → krijg een inspirerende quote
/joke → krijg een grappige mop
/ping → check bot status
/help → dit menu
`);
});

// 💬 NORMAAL CHATGEDRAG (reactie op tekstberichten)
bot.on('text', async (ctx) => {
  const user = ctx.from.username || ctx.from.id;
  const input = ctx.message.text;

  // voorkom dubbele trigger met commando's
  if (input.startsWith('/')) return;

  try {
    const reply = await handleBotLogic(user, input);
    await streamReply(ctx, reply);
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Error.");
  }
});

// 🚀 START BOT
bot.launch();
console.log("Telegram bot draait!");

// 🔒 netjes afsluiten
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
