const { Telegraf, Markup } = require('telegraf');
const { handleBotLogic, resetMemory } = require('./botLogic');
const { getBitcoinPrice } = require('./crypto');
const { searchInternet } = require('./search');

// Maak verbinding met de bot met behulp van je token uit Railway omgevingsvariabelen
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Log om te controleren of de bot opstart
console.log("Bot wordt gestart...");

// 🚀 START MENU MET BUTTONS
bot.start((ctx) => {
  console.log("Gebruiker start de bot..."); // Dit is een log die bevestigt dat /start wordt aangeroepen
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
  console.log("Gebruiker kiest 'ASK' actie.");
  await ctx.answerCbQuery();
  ctx.reply("Typ je vraag:");
});

bot.action("PRICE", async (ctx) => {
  console.log("Gebruiker kiest 'PRICE' actie.");
  await ctx.answerCbQuery();
  const price = await getBitcoinPrice();
  await streamReply(ctx, price);
});

bot.action("SEARCH", async (ctx) => {
  console.log("Gebruiker kiest 'SEARCH' actie.");
  await ctx.answerCbQuery();
  ctx.reply("Wat wil je zoeken?");
});

bot.action("RESET", async (ctx) => {
  console.log("Gebruiker kiest 'RESET' actie.");
  await ctx.answerCbQuery();
  const user = ctx.from.username || ctx.from.id;
  await resetMemory(user);
  ctx.reply("🧠 Geheugen gereset!");
});

// 💬 /ask COMMAND
bot.command('ask', async (ctx) => {
  console.log("Gebruiker gebruikt /ask command.");
  const user = ctx.from.username || ctx.from.id;
  const input = ctx.message.text.replace('/ask ', '');

  try {
    const reply = await handleBotLogic(user, input);
    await streamReply(ctx, reply);
  } catch (err) {
    console.error("Fout tijdens verwerken van /ask commando:", err);
    ctx.reply("❌ Er ging iets mis.");
  }
});

// 💰 /price COMMAND
bot.command('price', async (ctx) => {
  console.log("Gebruiker gebruikt /price command.");
  const input = ctx.message.text.toLowerCase();

  if (input.includes("bitcoin") || input.includes("btc")) {
    const price = await getBitcoinPrice();
    return streamReply(ctx, price);
  }

  ctx.reply("Gebruik: /price bitcoin");
});

// 🔎 /search COMMAND
bot.command('search', async (ctx) => {
  console.log("Gebruiker gebruikt /search command.");
  const input = ctx.message.text.replace('/search ', '');

  try {
    const result = await searchInternet(input);
    await streamReply(ctx, result);
  } catch (err) {
    console.error("Fout tijdens zoeken:", err);
    ctx.reply("❌ Kon niet zoeken.");
  }
});

// 🧠 /reset COMMAND
bot.command('reset', async (ctx) => {
  console.log("Gebruiker gebruikt /reset command.");
  const user = ctx.from.username || ctx.from.id;
  await resetMemory(user);
  ctx.reply("🧠 Geheugen gereset!");
});

// 🟢 /ping
bot.command('ping', (ctx) => {
  console.log("Gebruiker gebruikt /ping command.");
  ctx.reply("🏓 Pong!");
});

// ❓ /help
bot.command('help', (ctx) => {
  console.log("Gebruiker vraagt om hulp met /help.");
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
  console.log("Gebruiker stuurt een bericht.");
  const user = ctx.from.username || ctx.from.id;
  const input = ctx.message.text;

  // voorkom dubbele trigger met commands
  if (input.startsWith('/')) return;

  try {
    const reply = await handleBotLogic(user, input);
    await streamReply(ctx, reply);
  } catch (err) {
    console.error("Fout tijdens normaal chatgedrag:", err);
    ctx.reply("❌ Error.");
  }
});

// STREAMING EFFECT
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

    await new Promise(r => setTimeout(r, 80));
  }
}

// 🚀 START DE BOT
bot.launch()
  .then(() => {
    console.log("Bot succesvol gestart!"); // Logbericht als de bot succesvol is gestart
  })
  .catch((err) => {
    console.error("Fout bij starten bot:", err);
    process.exit(1); // Stop het proces als de bot niet kan starten
  });

// 🔒 netjes afsluiten
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
