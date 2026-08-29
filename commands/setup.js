const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { getGuildSettings, updateGuildSettings } = require('../lib/guildSettings');

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

    if (sub === 'show') {
      const settings = getGuildSettings(guildId);
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('⚙️ Server Settings')
        .addFields(
          { name: 'Voice Log Channel', value: settings.voiceLogChannelId ? `<#${settings.voiceLogChannelId}>` : 'Not set' },
          { name: 'YouTube Channel ID', value: settings.youtubeChannelId || 'Not set' },
          { name: 'YouTube Alert Channel', value: settings.liveAlertChannelId ? `<#${settings.liveAlertChannelId}>` : 'Not set' },
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
    }
  },
};
