require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Open het interactieve menu'),

  new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Stel een vraag aan de bot')
    .addStringOption(option =>
      option.setName('vraag')
        .setDescription('Je vraag')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('price')
    .setDescription('Bekijk crypto prijs')
    .addStringOption(option =>
      option.setName('coin')
        .setDescription('Bijv: bitcoin')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Reset je geheugen'),

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check of de bot werkt'),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Bekijk alle commands')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Slash commands registreren...');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID), // 👈 BELANGRIJK
      { body: commands }
    );

    console.log('✅ Commands geregistreerd!');
  } catch (error) {
    console.error(error);
  }
})();