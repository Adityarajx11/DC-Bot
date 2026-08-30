const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { getGuildSettings, updateGuildSettings, addSelfRole, removeSelfRole } = require('../lib/guildSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Admin only: configure this bot for your server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('voicelog')
        .setDescription('Set the channel for voice join/leave alerts')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Text channel for voice alerts')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('youtube')
        .setDescription('Set up YouTube "went live" alerts')
        .addStringOption(opt =>
          opt.setName('channel_id')
            .setDescription('YouTube channel ID (starts with UC...)')
            .setRequired(true))
        .addChannelOption(opt =>
          opt.setName('alert_channel')
            .setDescription('Text channel to post live alerts in')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('welcome')
        .setDescription('Set up welcome messages for new members')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel to post welcome messages in')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('message')
            .setDescription('Use {user}, {username}, {server}, {membercount} as placeholders')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('autorole')
        .setDescription('Set a role to auto-assign to new members')
        .addRoleOption(opt =>
          opt.setName('role')
            .setDescription('Role to assign automatically')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('selfroleadd')
        .setDescription('Add a role to a self-assignable category')
        .addRoleOption(opt =>
          opt.setName('role')
            .setDescription('Role to make self-assignable')
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('category')
            .setDescription('Category name, e.g. Games, Notifications, Pronouns')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('selfroleremove')
        .setDescription('Remove a role from self-assignable roles')
        .addRoleOption(opt =>
          opt.setName('role')
            .setDescription('Role to remove')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('show')
        .setDescription('Show current settings for this server'))
    .addSubcommand(sub =>
      sub.setName('disable')
        .setDescription('Turn off a feature for this server')
        .addStringOption(opt =>
          opt.setName('feature')
            .setDescription('Which feature to disable')
            .setRequired(true)
            .addChoices(
              { name: 'Voice log alerts', value: 'voicelog' },
              { name: 'YouTube live alerts', value: 'youtube' },
              { name: 'Welcome messages', value: 'welcome' },
              { name: 'Auto-role', value: 'autorole' },
            ))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'voicelog') {
      const channel = interaction.options.getChannel('channel');
      updateGuildSettings(guildId, { voiceLogChannelId: channel.id });
      return interaction.reply(`✅ Voice join/leave alerts will now post in ${channel}.`);
    }

    if (sub === 'youtube') {
      const channelId = interaction.options.getString('channel_id');
      const alertChannel = interaction.options.getChannel('alert_channel');
      updateGuildSettings(guildId, {
        youtubeChannelId: channelId,
        liveAlertChannelId: alertChannel.id,
      });
      return interaction.reply(`✅ Will watch YouTube channel \`${channelId}\` and post live alerts in ${alertChannel}.`);
    }

    if (sub === 'welcome') {
      const channel = interaction.options.getChannel('channel');
      const message = interaction.options.getString('message');
      updateGuildSettings(guildId, { welcomeChannelId: channel.id, welcomeMessage: message });
      return interaction.reply(`✅ Welcome messages will post in ${channel}.`);
    }

    if (sub === 'autorole') {
      const role = interaction.options.getRole('role');
      updateGuildSettings(guildId, { autoRoleId: role.id });
      return interaction.reply(`✅ New members will automatically get **${role.name}**.`);
    }

    if (sub === 'selfroleadd') {
      const role = interaction.options.getRole('role');
      const category = interaction.options.getString('category');
      addSelfRole(guildId, category, role.id);
      return interaction.reply(`✅ **${role.name}** added to category **${category}**.`);
    }

    if (sub === 'selfroleremove') {
      const role = interaction.options.getRole('role');
      const foundCategory = removeSelfRole(guildId, role.id);
      if (!foundCategory) {
        return interaction.reply({ content: `❌ **${role.name}** wasn't in any self-assignable category.`, ephemeral: true });
      }
      return interaction.reply(`☑️ Removed **${role.name}** from category **${foundCategory}**.`);
    }

    if (sub === 'show') {
      const settings = getGuildSettings(guildId);
      const categories = settings.selfRoleCategories || {};
      const categorySummary = Object.entries(categories)
        .map(([name, ids]) => `**${name}**: ${ids.length} role(s)`)
        .join('\n') || 'None set up';

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('⚙️ Server Settings')
        .addFields(
          { name: 'Voice Log Channel', value: settings.voiceLogChannelId ? `<#${settings.voiceLogChannelId}>` : 'Not set' },
          { name: 'YouTube Channel ID', value: settings.youtubeChannelId || 'Not set' },
          { name: 'YouTube Alert Channel', value: settings.liveAlertChannelId ? `<#${settings.liveAlertChannelId}>` : 'Not set' },
          { name: 'Welcome Channel', value: settings.welcomeChannelId ? `<#${settings.welcomeChannelId}>` : 'Not set' },
          { name: 'Welcome Message', value: settings.welcomeMessage || 'Not set' },
          { name: 'Auto-role', value: settings.autoRoleId ? `<@&${settings.autoRoleId}>` : 'Not set' },
          { name: 'Self-role Categories', value: categorySummary },
        );
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'disable') {
      const feature = interaction.options.getString('feature');
      if (feature === 'voicelog') {
        updateGuildSettings(guildId, { voiceLogChannelId: null });
        return interaction.reply('☑️ Voice log alerts disabled.');
      }
      if (feature === 'youtube') {
        updateGuildSettings(guildId, { youtubeChannelId: null, liveAlertChannelId: null });
        return interaction.reply('☑️ YouTube live alerts disabled.');
      }
      if (feature === 'welcome') {
        updateGuildSettings(guildId, { welcomeChannelId: null, welcomeMessage: null });
        return interaction.reply('☑️ Welcome messages disabled.');
      }
      if (feature === 'autorole') {
        updateGuildSettings(guildId, { autoRoleId: null });
        return interaction.reply('☑️ Auto-role disabled.');
      }
    }
  },
};
