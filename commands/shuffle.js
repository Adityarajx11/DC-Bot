const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../lib/musicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffle the upcoming songs in the queue'),

  async execute(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue || queue.songs.length < 3) {
      return interaction.reply({ content: '🚫 Not enough songs in queue to shuffle.', ephemeral: true });
    }

    const current = queue.songs[0];
    const rest = queue.songs.slice(1);

    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }

    queue.songs = [current, ...rest];
    return interaction.reply('🔀 Queue shuffled.');
  },
};
