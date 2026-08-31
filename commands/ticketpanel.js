const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const { getConfig } = require('../lib/ticketStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Post the ticket creation panel in the current channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const config = await getConfig(guildId);

    // Check if categories are configured
    if (!config || !config.categories || config.categories.length === 0) {
      return interaction.reply({
        content: '❌ No ticket categories configured yet. Please run `/ticketsetup addcategory` to add categories first.',
        ephemeral: true,
      });
    }

    // Build the embed
    const embed = new EmbedBuilder()
      .setColor(0x8B0000)
      .setTitle('Need Help? Open a Ticket')
      .setDescription('Select a category below to create a support ticket.');

    // Build the select menu options from configured categories
    const options = config.categories.map((category, index) => {
      const option = {
        label: category.label,
        value: String(index),
      };

      // Add emoji if present
      if (category.emoji) {
        option.emoji = category.emoji;
      }

      return option;
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ticket_create_select')
      .setPlaceholder('Choose a category...')
      .addOptions(options);

    const actionRow = new ActionRowBuilder().addComponents(selectMenu);

    // Post the panel
    await interaction.reply({
      embeds: [embed],
      components: [actionRow],
    });
  },
};
