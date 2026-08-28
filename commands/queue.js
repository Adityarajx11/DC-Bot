const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../lib/musicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current song queue'),

  async execute(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: '📭 The queue is empty.', ephemeral: true });
    }

    const list = queue.songs
      .slice(0, 15)
      .map((s, i) => `${i === 0 ? '▶️' : `${i}.`} **${s.title}** — requested by ${s.requestedBy}`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎶 Current Queue')
      .setDescription(list)
      .setFooter({ text: `${queue.songs.length} song(s) total • Loop: ${queue.loopMode}` });

    return interaction.reply({ embeds: [embed] });
  },
};
