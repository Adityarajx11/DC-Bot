const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../lib/musicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused song'),

  async execute(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue) {
      return interaction.reply({ content: '🚫 Nothing is playing.', ephemeral: true });
    }

    queue.player.unpause();
    return interaction.reply('▶️ Resumed.');
  },
};
