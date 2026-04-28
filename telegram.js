const { Telegraf } = require('telegraf');
const { handleBotLogic, resetMemory } = require('./botLogic');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.command('ask', async (ctx) => {
    const user = ctx.from.username || ctx.from.id;
    const input = ctx.message.text.replace('/ask ', '');

    await ctx.reply("Denkt na...🤔");
    const reply = await handleBotLogic(user, input);

    ctx.reply(reply);
});

bot.command('reset', async (ctx) => {
    const user = ctx.from.username || ctx.from.id;
    await resetMemory(user);
    ctx.reply("Memory gereset 🧠");
});


bot.launch({
  dropPendingUpdates: true
});