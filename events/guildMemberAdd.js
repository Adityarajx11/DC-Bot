const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../lib/guildSettings');
const { generateWelcomeCard } = require('../lib/welcomeCard');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      const guildId = member.guild.id;
      const settings = await getGuildSettings(guildId);

      // Apply auto-role if configured
      if (settings.autoRoleId) {
        try {
          const role = member.guild.roles.cache.get(settings.autoRoleId);
          if (role) {
            await member.roles.add(role);
          }
        } catch (err) {
          console.warn(`⚠️ Could not assign auto-role to ${member.user.tag}:`, err.message);
        }
      }

      // Send welcome message if configured
      if (settings.welcomeChannelId) {
        try {
          const channel = member.guild.channels.cache.get(settings.welcomeChannelId);
          if (!channel) return; // Channel no longer exists, skip silently

          // Generate welcome card image
          const imageBuffer = await generateWelcomeCard(member);

          // Default welcome message template
          const defaultTemplate = '{user} just landed in {server}! 🎉 We\'re now {membercount} members strong.';
          const messageTemplate = settings.welcomeMessage || defaultTemplate;

          // Replace placeholders with actual values
          const replacePlaceholders = (text) => {
            return text
              .replaceAll('{user}', member.toString())
              .replaceAll('{username}', member.user.username)
              .replaceAll('{server}', member.guild.name)
              .replaceAll('{membercount}', String(member.guild.memberCount));
          };

          const welcomeDescription = replacePlaceholders(messageTemplate);
          const mentionText = member.toString();

          // Create welcome embed with brand styling
          const embed = new EmbedBuilder()
            .setColor(0x8B0000)
            .setTitle('🎉 Welcome!')
            .setDescription(welcomeDescription)
            .setThumbnail(member.user.displayAvatarURL())
            .setFooter({ text: 'RAVEN • Welcome', iconURL: member.client.user.displayAvatarURL() })
            .setTimestamp();

          // Send message with mention, embed, and welcome card
          const attachment = new AttachmentBuilder(imageBuffer, { name: 'welcome.png' });
          await channel.send({
            content: mentionText,
            embeds: [embed],
            files: [attachment],
          });
        } catch (err) {
          console.error(`⚠️ Could not send welcome message for ${member.user.tag}:`, err.message);
        }
      }
    } catch (err) {
      console.error(`⚠️ Error in guildMemberAdd handler for ${member.user.tag}:`, err.message);
    }
  },
};
