const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserPlaylist, addToPlaylist, removeFromPlaylist } = require('../lib/playlistStore');
const { getQueue, createQueue, playSong, resolveSong } = require('../lib/musicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mylist')
    .setDescription('Manage your personal saved playlist')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add a song to your saved playlist')
        .addStringOption(opt =>
          opt.setName('song').setDescription('Song name or YouTube link').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('show')
        .setDescription('Show your saved playlist'))
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove a song from your saved playlist')
        .addIntegerOption(opt =>
          opt.setName('position').setDescription('Position number from /mylist show').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('play')
        .setDescription('Queue your entire saved playlist')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (sub === 'add') {
      await interaction.deferReply();
      const query = interaction.options.getString('song');
      const song = await resolveSong(query, interaction.user.tag);
      if (!song) return interaction.editReply('❌ Couldn\'t find that song.');

      addToPlaylist(userId, song);
      return interaction.editReply(`✅ Added **${song.title}** to your saved playlist.`);
    }

    if (sub === 'show') {
      const list = getUserPlaylist(userId);
      if (list.length === 0) {
        return interaction.reply({ content: '📭 Your playlist is empty. Add songs with `/mylist add`.', ephemeral: true });
      }

      const text = list.map((s, i) => `${i + 1}. **${s.title}**`).join('\n');
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🎶 ${interaction.user.username}'s Playlist`)
        .setDescription(text.slice(0, 4000));

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'remove') {
      const position = interaction.options.getInteger('position');
      const removed = removeFromPlaylist(userId, position - 1);
      if (!removed) {
        return interaction.reply({ content: '❌ Invalid position. Check `/mylist show` for numbers.', ephemeral: true });
      }
      return interaction.reply(`🗑️ Removed song #${position} from your playlist.`);
    }

    if (sub === 'play') {
      const voiceChannel = interaction.member.voice.channel;
      if (!voiceChannel) {
        return interaction.reply({ content: '🚫 Join a voice channel first.', ephemeral: true });
      }

      const list = getUserPlaylist(userId);
      if (list.length === 0) {
        return interaction.reply({ content: '📭 Your playlist is empty.', ephemeral: true });
      }

      await interaction.deferReply();

      let queue = getQueue(interaction.guild.id);
      if (!queue) {
        queue = createQueue(interaction.guild.id, voiceChannel, interaction.channel);
      }

      const wasEmpty = queue.songs.length === 0;
      queue.songs.push(...list);

      if (wasEmpty) {
        await playSong(interaction.guild.id, queue.songs[0]);
      }

      return interaction.editReply(`➕ Queued ${list.length} song(s) from your saved playlist.`);
    }
  },
};
