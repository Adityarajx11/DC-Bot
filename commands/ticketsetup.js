const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { getConfig, setConfig } = require('../lib/ticketStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketsetup')
    .setDescription('Admin only: configure the ticket system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('category')
        .setDescription('Set the category where ticket channels are created')
        .addChannelOption(opt => opt.setName('category').setDescription('Category channel').addChannelTypes(ChannelType.GuildCategory).setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('logchannel')
        .setDescription('Set the ticket log channel')
        .addChannelOption(opt => opt.setName('channel').setDescription('Log channel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('staffrole')
        .setDescription('Set the staff role for ticket claims')
        .addRoleOption(opt => opt.setName('role').setDescription('Staff role').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('maxtickets')
        .setDescription('Set the maximum open tickets per user')
        .addIntegerOption(opt => opt.setName('number').setDescription('Max tickets per user').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('addcategory')
        .setDescription('Add a ticket category option')
        .addStringOption(opt => opt.setName('label').setDescription('Category label').setRequired(true))
        .addStringOption(opt => opt.setName('emoji').setDescription('Optional emoji'))) 
    .addSubcommand(sub =>
      sub.setName('removecategory')
        .setDescription('Remove a ticket category option')
        .addStringOption(opt => opt.setName('label').setDescription('Category label to remove').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View current ticket configuration')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'category') {
      const category = interaction.options.getChannel('category');
      await setConfig(guildId, { category_channel_id: category.id });
      return interaction.reply({ content: `✅ Ticket category set to ${category}.`, ephemeral: true });
    }

    if (sub === 'logchannel') {
      const channel = interaction.options.getChannel('channel');
      await setConfig(guildId, { log_channel_id: channel.id });
      return interaction.reply({ content: `✅ Ticket log channel set to ${channel}.`, ephemeral: true });
    }

    if (sub === 'staffrole') {
      const role = interaction.options.getRole('role');
      await setConfig(guildId, { staff_role_id: role.id });
      return interaction.reply({ content: `✅ Ticket staff role set to **${role.name}**.`, ephemeral: true });
    }

    if (sub === 'maxtickets') {
      const num = interaction.options.getInteger('number');
      await setConfig(guildId, { max_tickets_per_user: num });
      return interaction.reply({ content: `✅ Max tickets per user set to **${num}**.`, ephemeral: true });
    }

    if (sub === 'addcategory') {
      const label = interaction.options.getString('label');
      const emoji = interaction.options.getString('emoji') || null;
      const cfg = await getConfig(guildId) || { categories: [] };
      const categories = cfg.categories || [];
      categories.push({ label, emoji });
      await setConfig(guildId, { categories });
      return interaction.reply({ content: `✅ Added category **${label}**.`, ephemeral: true });
    }

    if (sub === 'removecategory') {
      const label = interaction.options.getString('label');
      const cfg = await getConfig(guildId) || { categories: [] };
      const categories = (cfg.categories || []).filter(c => c.label !== label);
      await setConfig(guildId, { categories });
      return interaction.reply({ content: `☑️ Removed category **${label}**.`, ephemeral: true });
    }

    if (sub === 'view') {
      const cfg = await getConfig(guildId) || {};
      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('🎫 Ticket Configuration')
        .addFields(
          { name: 'Category Channel', value: cfg.category_channel_id ? `<#${cfg.category_channel_id}>` : 'Not set', inline: true },
          { name: 'Log Channel', value: cfg.log_channel_id ? `<#${cfg.log_channel_id}>` : 'Not set', inline: true },
          { name: 'Staff Role', value: cfg.staff_role_id ? `<@&${cfg.staff_role_id}>` : 'Not set', inline: true },
          { name: 'Max Tickets Per User', value: String(cfg.max_tickets_per_user || 1), inline: true },
          { name: 'Categories', value: (cfg.categories || []).map(c => `${c.emoji ? c.emoji + ' ' : ''}${c.label}`).join('\n') || 'None configured' }
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
