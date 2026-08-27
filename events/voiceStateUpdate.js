const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const logChannelId = process.env.VOICE_LOG_CHANNEL_ID;
    if (!logChannelId) return;

    const channel = newState.guild.channels.cache.get(logChannelId);
    if (!channel) return;

    const member = newState.member ?? oldState.member;
    const name = member.displayName;
    const avatar = member.displayAvatarURL();

    if (!oldState.channelId && newState.channelId) {
      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setAuthor({ name, iconURL: avatar })
        .setDescription(`🔊 **${name}** joined **${newState.channel.name}**`)
        .setTimestamp();
      return channel.send({ embeds: [embed] });
    }

    if (oldState.channelId && !newState.channelId) {
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setAuthor({ name, iconURL: avatar })
        .setDescription(`🔇 **${name}** left **${oldState.channel.name}**`)
        .setTimestamp();
      return channel.send({ embeds: [embed] });
    }

    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setAuthor({ name, iconURL: avatar })
        .setDescription(`↔️ **${name}** moved from **${oldState.channel.name}** to **${newState.channel.name}**`)
        .setTimestamp();
      return channel.send({ embeds: [embed] });
    }
  },
};
