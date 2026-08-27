const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

function isOwner(userId) {
  const owners = (process.env.OWNER_IDS || '').split(',').map(s => s.trim());
  return owners.includes(userId);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('massdm')
    .setDescription('Owner/Admin only: DM a message to every member in the server')
    .addStringOption(opt =>
      opt.setName('message')
        .setDescription('The message to send')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('title')
        .setDescription('Optional embed title')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!isOwner(interaction.user.id) && !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '🚫 You are not allowed to use this command.', ephemeral: true });
    }

    const message = interaction.options.getString('message');
    const title = interaction.options.getString('title');

    await interaction.reply({ content: '📨 Starting mass DM... this may take a while for large servers.', ephemeral: true });

    const members = await interaction.guild.members.fetch();
    const humans = members.filter(m => !m.user.bot);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setDescription(message)
      .setFooter({ text: `Sent from ${interaction.guild.name}` })
      .setTimestamp();
    if (title) embed.setTitle(title);

    let sent = 0;
    let failed = 0;

    for (const [, member] of humans) {
      try {
        await member.send({ embeds: [embed] });
        sent++;
      } catch {
        failed++;
      }
      await new Promise(r => setTimeout(r, 300));
    }

    await interaction.followUp({
      content: `✅ Mass DM complete. Sent: **${sent}** | Failed (DMs closed/blocked): **${failed}**`,
      ephemeral: true,
    });
  },
};
