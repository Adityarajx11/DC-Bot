const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { parseDuration } = require('../lib/reminders');

const MAX_MS = 7 * 24 * 60 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Set a reminder')
    .addStringOption(opt =>
      opt.setName('time')
        .setDescription('e.g. 10m, 2h, 1d (max 7 days)')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('message')
        .setDescription('What to remind you about')
        .setRequired(true)),

  async execute(interaction) {
    const timeInput = interaction.options.getString('time');
    const message = interaction.options.getString('message');

    const ms = parseDuration(timeInput);

    if (!ms) {
      return interaction.reply({ content: '❌ Couldn\'t understand that time. Try formats like `10m`, `2h`, or `1d`.', ephemeral: true });
    }

    if (ms > MAX_MS) {
      return interaction.reply({ content: '🚫 Max reminder time is 7 days.', ephemeral: true });
    }

    await interaction.reply({ content: `⏰ Got it — I'll remind you in **${timeInput}**.`, ephemeral: true });

    setTimeout(async () => {
      const embed = new EmbedBuilder()
        .setColor(0xFAA61A)
        .setTitle('⏰ Reminder')
        .setDescription(message)
        .setFooter({ text: `Set ${timeInput} ago` })
        .setTimestamp();

      try {
        await interaction.user.send({ embeds: [embed] });
      } catch {
        interaction.channel?.send({ content: `${interaction.user}`, embeds: [embed] }).catch(() => {});
      }
    }, ms);
  },
};
