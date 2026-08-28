const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../lib/musicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current song'),

  async execute(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: '🚫 Nothing is playing.', ephemeral: true });
    }

    queue.player.pause();
    return interaction.reply('⏸️ Paused.');
  },
};
