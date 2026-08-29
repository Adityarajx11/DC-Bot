const { SlashCommandBuilder } = require('discord.js');
const { getManager } = require('../lib/lavalink');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Disconnect the bot from voice and clear the queue'),

  async execute(interaction) {
    const player = getManager().getPlayer(interaction.guild.id);
    if (player) await player.destroy();
    return interaction.reply('👋 Left the voice channel.');
  },
};