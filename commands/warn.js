const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createCase } = require('../lib/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member (logged as a case, no punishment applied)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt => opt.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the warning').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    const caseNumber = await createCase({
      guildId: interaction.guild.id,
      action: 'warn',
      targetId: target.id,
      targetTag: target.tag,
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag,
      reason,
    });

    target.send(`⚠️ You were warned in **${interaction.guild.name}**: ${reason}`).catch(() => {});

    return interaction.reply(`⚠️ Warned **${target.tag}**. Case #${caseNumber}. Reason: ${reason}`);
  },
};