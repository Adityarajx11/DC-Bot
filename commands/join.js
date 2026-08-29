const { SlashCommandBuilder } = require('discord.js');
const { getOrCreatePlayer } = require('../lib/lavalink');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Bring the bot into your voice channel'),

  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: '🚫 Join a voice channel first.', ephemeral: true });
    }

    const player = getOrCreatePlayer(interaction);
    if (!player.connected) await player.connect();

    return interaction.reply(`✅ Joined **${voiceChannel.name}**.`);
  },
};