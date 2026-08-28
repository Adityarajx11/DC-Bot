const { SlashCommandBuilder } = require('discord.js');
const { getQueue, createQueue, playSong, resolveSong } = require('../lib/musicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song by name or link, or add it to the queue')
    .addStringOption(opt =>
      opt.setName('song')
        .setDescription('Song name or YouTube link')
        .setRequired(true)),

  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: '🚫 Join a voice channel first.', ephemeral: true });
    }

    await interaction.deferReply();

    const query = interaction.options.getString('song');
    const song = await resolveSong(query, interaction.user.tag);

    if (!song) {
      return interaction.editReply('❌ Couldn\'t find that song.');
    }

    let queue = getQueue(interaction.guild.id);
    if (!queue) {
      queue = createQueue(interaction.guild.id, voiceChannel, interaction.channel);
    }

    queue.songs.push(song);

    if (queue.songs.length === 1) {
      await playSong(interaction.guild.id, song);
      return interaction.editReply(`🎶 Loading **${song.title}**...`);
    } else {
      return interaction.editReply(`➕ Added to queue: **${song.title}** (position ${queue.songs.length})`);
    }
  },
};
