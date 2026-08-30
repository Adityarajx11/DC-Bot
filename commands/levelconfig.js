const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { setLevelConfig, getLevelConfig, addLevelRole, removeLevelRole, getLevelRoles } = require('../lib/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('levelconfig')
    .setDescription('Admin only: configure the leveling system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('channel')
        .setDescription('Set the level-up announcement channel and message')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel for level-up announcements')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('message')
            .setDescription('Use {user} and {level} as placeholders')
            .setRequired(false)))
    .addSubcommand(sub =>
      sub.setName('role')
        .setDescription('Set a role to award at a specific level')
        .addIntegerOption(opt => opt.setName('level').setDescription('Level required').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Role to award').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('removerole')
        .setDescription('Remove a level role')
        .addIntegerOption(opt => opt.setName('level').setDescription('Level to clear').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('show')
        .setDescription('Show current leveling configuration')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'channel') {
      const channel = interaction.options.getChannel('channel');
      const message = interaction.options.getString('message') || '🎉 {user} leveled up to **Level {level}**!';
      await setLevelConfig(guildId, channel.id, message);
      return interaction.reply(`✅ Level-up messages will now post in ${channel}.`);
    }

    if (sub === 'role') {
      const level = interaction.options.getInteger('level');
      const role = interaction.options.getRole('role');
      await addLevelRole(guildId, level, role.id);
      return interaction.reply(`✅ Members will get **${role.name}** at level **${level}**.`);
    }

    if (sub === 'removerole') {
      const level = interaction.options.getInteger('level');
      await removeLevelRole(guildId, level);
      return interaction.reply(`☑️ Removed the level role for level **${level}**.`);
    }

    if (sub === 'show') {
      const config = await getLevelConfig(guildId);
      const roles = await getLevelRoles(guildId);
      const rolesText = roles.map(r => `Level ${r.level} → <@&${r.role_id}>`).join('\n') || 'None set';

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🏆 Leveling Configuration')
        .addFields(
          { name: 'Announcement Channel', value: config?.channel_id ? `<#${config.channel_id}>` : 'Not set (uses message channel)' },
          { name: 'Message Template', value: config?.message_template || '🎉 {user} leveled up to **Level {level}**!' },
          { name: 'Level Roles', value: rolesText },
        );
      return interaction.reply({ embeds: [embed] });
    }
  },
};
