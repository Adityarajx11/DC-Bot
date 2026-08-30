const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createCase } = require('../lib/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bulkban')
    .setDescription('Ban multiple users at once by ID')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(opt =>
      opt.setName('user_ids')
        .setDescription('Space or comma separated user IDs')
        .setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the bans').setRequired(false)),

  async execute(interaction) {
    const rawIds = interaction.options.getString('user_ids');
    const reason = interaction.options.getString('reason') || 'Bulk ban';
    const ids = rawIds.split(/[\s,]+/).filter(Boolean);

    if (ids.length === 0) {
      return interaction.reply({ content: '❌ No valid user IDs provided.', ephemeral: true });
    }
    if (ids.length > 50) {
      return interaction.reply({ content: '🚫 Max 50 users per bulk ban.', ephemeral: true });
    }

    await interaction.deferReply();

    let banned = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await interaction.guild.members.ban(id, { reason });
        await createCase({
          guildId: interaction.guild.id,
          action: 'ban',
          targetId: id,
          targetTag: id,
          moderatorId: interaction.user.id,
          moderatorTag: interaction.user.tag,
          reason,
        });
        banned++;
      } catch {
        failed++;
      }
    }

    return interaction.editReply(`🔨 Bulk ban complete. Banned: **${banned}**, Failed: **${failed}**.`);
  },
};