const { EmbedBuilder } = require('discord.js');

// Dark red theme across all voice events
const THEME_COLOR = 0x8B0000; // dark red

function buildEmbed({ name, avatar, action, emoji, channelName, memberCount, footerIcon }) {
  return new EmbedBuilder()
    .setColor(THEME_COLOR)
    .setAuthor({ name: `${emoji} Voice Activity`, iconURL: footerIcon })
    .setThumbnail(avatar)
    .setTitle(`${name}`)
    .setDescription(`**${name}** ${action}`)
    .addFields(
      { name: 'Channel', value: channelName, inline: true },
      { name: 'Members in VC', value: `${memberCount}`, inline: true },
    )
    .setFooter({ text: 'Voice Log', iconURL: footerIcon })
    .setTimestamp();
}

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const logChannelId = process.env.VOICE_LOG_CHANNEL_ID;
    if (!logChannelId) return;

    const channel = newState.guild.channels.cache.get(logChannelId);
    if (!channel) return;

    const member = newState.member ?? oldState.member;
    const name = member.displayName;
    const avatar = member.displayAvatarURL({ size: 256 });
    const guildIcon = newState.guild.iconURL({ size: 256 });

    let embed = null;

    if (!oldState.channelId && newState.channelId) {
      embed = buildEmbed({
        name,
        avatar,
        action: `joined **${newState.channel.name}**`,
        emoji: '🔊',
        channelName: newState.channel.name,
        memberCount: newState.channel.members.size,
        footerIcon: guildIcon,
      });
    }
    else if (oldState.channelId && !newState.channelId) {
      embed = buildEmbed({
        name,
        avatar,
        action: `left **${oldState.channel.name}**`,
        emoji: '🔇',
        channelName: oldState.channel.name,
        memberCount: oldState.channel.members.size,
        footerIcon: guildIcon,
      });
    }
    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      embed = buildEmbed({
        name,
        avatar,
        action: `moved from **${oldState.channel.name}** to **${newState.channel.name}**`,
        emoji: '↔️',
        channelName: newState.channel.name,
        memberCount: newState.channel.members.size,
        footerIcon: guildIcon,
      });
    }

    if (!embed) return;

    try {
      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('⚠️ Could not send voice alert (check bot permissions in that channel):', err.message);
    }
  },
};
