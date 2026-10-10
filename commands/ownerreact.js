const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getGuildSettings, updateGuildSettings } = require('../lib/guildSettings');

const EMOJI_REGEX = /<a?:[\w]+:(\d+)>/g;

function parseEmojis(content) {
  const emojis = [];
  let match;
  while ((match = EMOJI_REGEX.exec(content)) !== null) {
    emojis.push(match[0]);
  }
  return emojis;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ownerreact')
    .setDescription('Configure emoji reactions for messages from owner IDs')
    .addSubcommand(sub =>
      sub
        .setName('set')
        .setDescription('Set the emoji sequence for owner reactions')
        .addStringOption(opt =>
          opt
            .setName('emojis')
            .setDescription('Paste custom emojis in order (they will be parsed automatically)')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('clear')
        .setDescription('Clear the emoji sequence for this server')
    )
    .addSubcommand(sub =>
      sub
        .setName('view')
        .setDescription('View the currently configured emoji sequence')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (subcommand === 'set') {
      const emojiInput = interaction.options.getString('emojis');
      const emojis = parseEmojis(emojiInput);

      if (emojis.length === 0) {
        return interaction.reply({
          content: '❌ No valid custom emojis found. Please paste custom emojis in order.',
          ephemeral: true,
        });
      }

      await updateGuildSettings(guildId, { ownerReactEmojis: emojis });

      const embed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('✅ Owner React Emojis Updated')
        .setDescription(`Configured ${emojis.length} emoji(s):`)
        .addFields({
          name: 'Emojis',
          value: emojis.join(' '),
        })
        .setFooter({ text: 'RAVEN • Owner React' });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'clear') {
      await updateGuildSettings(guildId, { ownerReactEmojis: [] });

      return interaction.reply({
        content: '✅ Owner react emojis cleared.',
        ephemeral: true,
      });
    }

    if (subcommand === 'view') {
      const settings = await getGuildSettings(guildId);
      const emojis = settings.ownerReactEmojis || [];

      if (emojis.length === 0) {
        return interaction.reply({
          content: '📭 No owner react emojis configured for this server.',
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('📋 Owner React Emojis')
        .setDescription(`${emojis.length} emoji(s) configured:`)
        .addFields({
          name: 'Sequence',
          value: emojis.join(' '),
        })
        .setFooter({ text: 'RAVEN • Owner React' });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
