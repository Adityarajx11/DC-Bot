const { SlashCommandBuilder } = require('discord.js');
const { destroyQueue } = require('../lib/musicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Disconnect the bot from voice and clear the queue'),

  async execute(interaction) {
    destroyQueue(interaction.guild.id);
    return interaction.reply('👋 Left the voice channel.');
  },
};
