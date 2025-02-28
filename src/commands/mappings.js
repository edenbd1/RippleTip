const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { getUserMappings, formatAddress } = require('../utils/mappingUtils');
const { getAddressUrl } = require('../utils/tipUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mappings')
    .setDescription('View your address mappings'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const userId = interaction.user.id;
      const mappings = await getUserMappings(userId);

      if (mappings.length === 0) {
        return interaction.editReply({ 
          content: 'You have no mappings. Use `/map` to create one.' 
        });
      }

      // Create the embed
      const embed = new EmbedBuilder()
        .setColor('#0066cc')
        .setTitle('🗺️ Your Mappings')
        .setDescription('Here are your mappings:');

      // Add fields for each mapping
      mappings.forEach(mapping => {
        const identifier = mapping.identifierType === 'user' 
          ? `<@${mapping.identifier}>` 
          : mapping.identifier;
        
        embed.addFields({ 
          name: identifier, 
          value: `[${formatAddress(mapping.address)}](${getAddressUrl(mapping.address)})`, 
          inline: true 
        });
      });

      // Add navigation buttons if there are many mappings
      const components = [];
      if (mappings.length > 9) {
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('mapping_prev_1')
              .setLabel('Previous')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('mapping_next_1')
              .setLabel('Next')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(false)
          );
        components.push(row);
      }

      // Add a button to create a new mapping
      const actionRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('help_general')
            .setLabel('Back to Help')
            .setStyle(ButtonStyle.Secondary)
        );
      components.push(actionRow);

      await interaction.editReply({ 
        embeds: [embed], 
        components: components
      });
    } catch (error) {
      console.error('Error in mappings command:', error);
      await interaction.editReply({ content: '❌ An error occurred while processing your request.' });
    }
  },

  // Handle navigation buttons
  async handleNavigation(interaction, action, currentPage, searchAddress = '', searchUserId = '') {
    try {
      const userId = interaction.user.id;
      const limit = 9; // Number of mappings per page
      const skip = (currentPage - 1) * limit;

      // Build the query
      let query = {
        $or: [
          { identifier: userId, identifierType: 'user' },
          { createdBy: userId }
        ]
      };

      // Add search filters if provided
      if (searchAddress) {
        query.address = { $regex: searchAddress, $options: 'i' };
      }
      if (searchUserId) {
        query.identifier = searchUserId;
      }

      // Get total count for pagination
      const totalMappings = await Mapping.countDocuments(query);
      const totalPages = Math.ceil(totalMappings / limit);

      // Get mappings for the current page
      const mappings = await Mapping.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Create the embed
      const embed = new EmbedBuilder()
        .setColor('#0066cc')
        .setTitle('🗺️ Your Mappings')
        .setDescription(`Page ${currentPage} of ${totalPages}`);

      // Add fields for each mapping
      mappings.forEach(mapping => {
        const identifier = mapping.identifierType === 'user' 
          ? `<@${mapping.identifier}>` 
          : mapping.identifier;
        
        embed.addFields({ 
          name: identifier, 
          value: `[${formatAddress(mapping.address)}](${getAddressUrl(mapping.address)})`, 
          inline: true 
        });
      });

      // Create navigation buttons
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`mapping_prev_${currentPage}_${searchAddress}_${searchUserId}`)
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage <= 1),
          new ButtonBuilder()
            .setCustomId(`mapping_next_${currentPage}_${searchAddress}_${searchUserId}`)
            .setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage >= totalPages)
        );

      // Add a button to go back to help
      const actionRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('help_general')
            .setLabel('Back to Help')
            .setStyle(ButtonStyle.Secondary)
        );

      // Update the message
      await interaction.update({ 
        embeds: [embed], 
        components: [row, actionRow] 
      });
    } catch (error) {
      console.error('Error handling mappings navigation:', error);
      await interaction.update({ 
        content: '❌ An error occurred while navigating mappings.', 
        components: [] 
      });
    }
  }
}; 