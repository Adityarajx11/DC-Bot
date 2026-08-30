const { EmbedBuilder } = require('discord.js');
const { getUserXp, upsertUserXp, getLevelRoles } = require('../lib/db');
const { calculateLevelUp, isOnCooldown } = require('../lib/leveling');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;
    if (isOnCooldown(message.guild.id, message.author.id)) return;

    const existing = await getUserXp(message.guild.id, message.author.id);
    const currentXp = existing?.xp || 0;
    const currentLevel = existing?.level || 0;

    const earnedXp = Math.floor(Math.random() * 11) + 15; // 15-25 xp per message
    const { xp, level, levelsGained } = calculateLevelUp(currentXp, currentLevel, earnedXp);

    await upsertUserXp(message.guild.id, message.author.id, xp, level, new Date());

    if (levelsGained > 0) {
      message.channel.send({
        content: `🎉 ${message.author} leveled up to **Level ${level}**!`,
      }).catch(() => {});

      const levelRoles = await getLevelRoles(message.guild.id);
      const roleToGrant = levelRoles.filter(r => r.level <= level).sort((a, b) => b.level - a.level)[0];

      if (roleToGrant) {
        const role = message.guild.roles.cache.get(roleToGrant.role_id);
        const member = message.member;
        if (role && member && !member.roles.cache.has(role.id)) {
          member.roles.add(role).catch(() => {});
        }
      }
    }
  },
};