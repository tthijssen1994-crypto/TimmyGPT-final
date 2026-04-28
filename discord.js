const { Client, GatewayIntentBits } = require('discord.js');
const { handleBotLogic } = require('./botLogic');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('clientReady', () => {
    console.log(`Discord bot online als ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.mentions.has(client.user)) {
        const input = message.content.replace(/<@!?\d+>/, '').trim();
        const user = message.author.username;

        await message.channel.sendTyping();
        const reply = await handleBotLogic(user, input);

        message.reply(reply);
    }
});

client.login(process.env.DISCORD_TOKEN);