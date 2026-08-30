const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserXp } = require('../lib/db');
const { xpForLevel } = require('../lib/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your (or someone else\'s) level and XP')
    .addUserOption(opt => opt.setName('user').setDescription('User to check').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const data = await getUserXp(interaction.guild.id, target.id);

    if (!data) {
      return interaction.reply({ content: `📭 **${target.tag}** hasn't earned any XP yet.`, ephemeral: true });
    }

    const needed = xpForLevel(data.level);
    const percent = Math.round((data.xp / needed) * 100);
    const barLength = Math.round(percent / 10);
    const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
      .setTitle(`🏆 Level ${data.level}`)
      .setDescription(`${bar}\n${data.xp} / ${needed} XP (${percent}%)`);

    return interaction.reply({ embeds: [embed] });
  },
};