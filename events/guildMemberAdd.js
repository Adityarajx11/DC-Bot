const { AttachmentBuilder } = require('discord.js');
const { getGuildSettings } = require('../lib/guildSettings');
const { generateWelcomeCard } = require('../lib/welcomeCard');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const guildId = member.guild.id;
    const settings = getGuildSettings(guildId);

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

        // Replace placeholders in welcome message
        let welcomeText = settings.welcomeMessage
          .replace('{user}', `<@${member.id}>`)
          .replace('{username}', member.user.username)
          .replace('{server}', member.guild.name)
          .replace('{membercount}', member.guild.memberCount);

        // Send message with welcome card
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'welcome.png' });
        await channel.send({
          content: welcomeText,
          files: [attachment],
        });
      } catch (err) {
        console.error(`⚠️ Could not send welcome message for ${member.user.tag}:`, err.message);
      }
    }
  },
};
