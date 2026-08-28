const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../lib/musicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the playback volume (0-200%)')
    .addIntegerOption(opt =>
      opt.setName('percent')
        .setDescription('Volume percentage, e.g. 100')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(200)),

  async execute(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue) {
      return interaction.reply({ content: '🚫 Nothing is playing.', ephemeral: true });
    }

    const percent = interaction.options.getInteger('percent');
    queue.volume = percent / 100;

    if (queue.currentResource?.volume) {
      queue.currentResource.volume.setVolume(queue.volume);
    }

    return interaction.reply(`🔊 Volume set to ${percent}%.`);
  },
};
