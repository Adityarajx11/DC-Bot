const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../lib/musicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playback and clear the queue'),

  async execute(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue) {
      return interaction.reply({ content: '🚫 Nothing is playing.', ephemeral: true });
    }

    queue.songs = [];
    queue.loopMode = 'off';
    queue.player.stop();
    return interaction.reply('⏹️ Stopped and cleared the queue.');
  },
};
