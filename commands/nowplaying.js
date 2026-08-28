const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../lib/musicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show the currently playing song'),

  async execute(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: '📭 Nothing is playing.', ephemeral: true });
    }

    const song = queue.songs[0];
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎵 Now Playing')
      .setDescription(`**${song.title}**`)
      .addFields(
        { name: 'Requested by', value: song.requestedBy, inline: true },
        { name: 'Loop', value: queue.loopMode, inline: true },
        { name: 'Volume', value: `${Math.round(queue.volume * 100)}%`, inline: true },
      );

    return interaction.reply({ embeds: [embed] });
  },
};
