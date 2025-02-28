const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display help and information about available commands')
    .addStringOption(option =>
      option.setName('command')
        .setDescription('Specific command you want help with')
        .setRequired(false)
        .addChoices(
          { name: 'balance', value: 'balance' },
          { name: 'connect', value: 'connect' },
          { name: 'create-wallet', value: 'create-wallet' },
          { name: 'disconnect', value: 'disconnect' },
          { name: 'history', value: 'history' },
          { name: 'leaderboard', value: 'leaderboard' },
          { name: 'map', value: 'map' },
          { name: 'mapping', value: 'mapping' },
          { name: 'tip', value: 'tip' },
          { name: 'unmap', value: 'unmap' }
        )),
  
  async execute(interaction) {
    try {
      // Reply immediately to avoid timeout errors
      await interaction.reply({ content: "Generating help...", ephemeral: true });
      
      // Get the specific command if specified
      const specificCommand = interaction.options.getString('command');
      
      // If a specific command is requested, display help for that command
      if (specificCommand) {
        await this.showCommandHelp(interaction, specificCommand);
      } else {
        // Otherwise, display general help
        await this.showGeneralHelp(interaction);
      }
      
    } catch (error) {
      console.error('Error displaying help:', error);
      
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({
          content: `An error occurred while displaying help: ${error.message}`,
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: `An error occurred while displaying help: ${error.message}`,
          ephemeral: true
        });
      }
    }
  },
  
  // Function to display general help
  async showGeneralHelp(interaction) {
    // Create an embed for general help
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('📚 RippleTip Bot Help')
      .setDescription('RippleTip is a bot that allows you to send and receive RLUSD (Ripple USD) on the Sepolia blockchain (Ethereum testnet).')
      .addFields(
        { name: '🔰 Basic Commands', value: 
          '`/create-wallet` - Create a new wallet\n' +
          '`/connect` - Connect an existing wallet\n' +
          '`/disconnect` - Disconnect your wallet\n' +
          '`/balance` - Check your RLUSD balance'
        },
        { name: '💸 Transactions', value: 
          '`/tip` - Send RLUSD to a user or address\n' +
          '`/history` - View your transaction history'
        },
        { name: '🔗 Mappings', value: 
          '`/map` - Associate an Ethereum address with your Discord account\n' +
          '`/unmap` - Remove the association between your Discord account and an address\n' +
          '`/mapping` - View the associations between addresses and users'
        },
        { name: '📊 Statistics', value: 
          '`/leaderboard` - View the ranking of users by RLUSD balance'
        },
        { name: '❓ Help', value: 
          '`/help [command]` - Display general help or help for a specific command'
        }
      )
      .addFields({
        name: '📝 Important Note',
        value: 'This bot uses the Sepolia blockchain (Ethereum testnet). RLUSD tokens are test tokens and have no real value.'
      })
      .setTimestamp();
    
    // Create buttons for useful links
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setURL('https://sepolia.etherscan.io/token/0x1c7d4b196cb0c7b01d743fbc6116a902379c7238')
          .setLabel('RLUSD on Etherscan')
          .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
          .setURL('https://tryrlusd.com/')
          .setLabel('RLUSD Faucet')
          .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
          .setURL('https://www.sepoliafaucet.io/')
          .setLabel('ETH Sepolia Faucet')
          .setStyle(ButtonStyle.Link)
      );
    
    // Send the embed to the user
    await interaction.editReply({
      content: null,
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  },
  
  // Function to display help for a specific command
  async showCommandHelp(interaction, commandName) {
    // Define help information for each command
    const commandHelp = {
      'balance': {
        title: '💰 Command: /balance',
        description: 'Check your RLUSD balance or that of another user.',
        usage: '`/balance [user]`',
        options: [
          { name: 'user', description: 'User whose balance you want to check (optional)' }
        ],
        examples: [
          '`/balance` - Check your own balance',
          '`/balance @user` - Check another user\'s balance'
        ]
      },
      'connect': {
        title: '🔌 Command: /connect',
        description: 'Connect an existing Ethereum wallet to your Discord account.',
        usage: '`/connect address private_key`',
        options: [
          { name: 'address', description: 'Ethereum address of your wallet' },
          { name: 'private_key', description: 'Private key of your wallet (visible only to you)' }
        ],
        examples: [
          '`/connect 0x1234...5678 0xabcd...ef01` - Connect an existing wallet'
        ],
        warning: '⚠️ Never share your private key with anyone. The `/connect` command is secure and your private key is only visible to you.'
      },
      'create-wallet': {
        title: '🔑 Command: /create-wallet',
        description: 'Create a new Ethereum wallet and connect it to your Discord account. This command automatically generates an Ethereum address and a secure private key, allowing you to send and receive RLUSD immediately. Ideal for new users who don\'t have an Ethereum wallet yet.',
        usage: '`/create-wallet`',
        options: [],
        examples: [
          '`/create-wallet` - Create a new wallet'
        ],
        warning: '⚠️ Make sure to save your private key in a safe place. If you lose it, you will no longer be able to access your funds.',
        note: 'After creating your wallet, you will need tokens to use it. You can get free RLUSD at https://tryrlusd.com/ and Sepolia ETH at https://www.sepoliafaucet.io/ to pay for transaction fees.'
      },
      'disconnect': {
        title: '🔓 Command: /disconnect',
        description: 'Disconnect your Ethereum wallet from your Discord account.',
        usage: '`/disconnect`',
        options: [],
        examples: [
          '`/disconnect` - Disconnect your wallet'
        ]
      },
      'history': {
        title: '📜 Command: /history',
        description: 'View your RLUSD transaction history.',
        usage: '`/history [page]`',
        options: [
          { name: 'page', description: 'Page number to display (optional)' }
        ],
        examples: [
          '`/history` - View the first page of your history',
          '`/history 2` - View the second page of your history'
        ]
      },
      'leaderboard': {
        title: '🏆 Command: /leaderboard',
        description: 'View the ranking of users by RLUSD balance.',
        usage: '`/leaderboard [page] [refresh]`',
        options: [
          { name: 'page', description: 'Page number to display (optional)' },
          { name: 'refresh', description: 'Refresh balances from the blockchain (optional)' }
        ],
        examples: [
          '`/leaderboard` - View the first page of the leaderboard',
          '`/leaderboard 2` - View the second page of the leaderboard',
          '`/leaderboard refresh:true` - View the leaderboard with refreshed balances'
        ]
      },
      'map': {
        title: '🔗 Command: /map',
        description: 'Associate an Ethereum address with your Discord account to receive tips.',
        usage: '`/map address`',
        options: [
          { name: 'address', description: 'Ethereum address to associate with your account' }
        ],
        examples: [
          '`/map 0x1234...5678` - Associate an address with your account'
        ],
        note: 'This command only allows you to receive tips. To send RLUSD, you must connect a wallet with a private key using `/connect` or create a new one with `/create-wallet`.'
      },
      'mapping': {
        title: '📋 Command: /mapping',
        description: 'View the associations between Ethereum addresses and Discord users.',
        usage: '`/mapping [address] [user] [page]`',
        options: [
          { name: 'address', description: 'Ethereum address to search for (optional)' },
          { name: 'user', description: 'Discord user to search for (optional)' },
          { name: 'page', description: 'Page number to display (optional)' }
        ],
        examples: [
          '`/mapping` - View all associations',
          '`/mapping address:0x1234` - Search for a specific address',
          '`/mapping user:@user` - Search for a specific user'
        ]
      },
      'tip': {
        title: '💸 Command: /tip',
        description: 'Send RLUSD to a recipient (Discord user or Ethereum address).',
        usage: '`/tip recipient amount [message]`',
        options: [
          { name: 'recipient', description: 'Ethereum address or @user' },
          { name: 'amount', description: 'Amount of RLUSD to send' },
          { name: 'message', description: 'Personal message with your tip (optional)' }
        ],
        examples: [
          '`/tip @user 100` - Send 100 RLUSD to a user',
          '`/tip 0x1234...5678 50 "Thanks for your help!"` - Send 50 RLUSD to an address with a message'
        ],
        warning: '⚠️ You must have a wallet connected with a private key to send tips.'
      },
      'unmap': {
        title: '🔗 Command: /unmap',
        description: 'Remove the association between your Discord account and an Ethereum address.',
        usage: '`/unmap address`',
        options: [
          { name: 'address', description: 'Ethereum address to remove from your account' }
        ],
        examples: [
          '`/unmap 0x1234...5678` - Remove the association with an address'
        ],
        note: 'This command can only be used if you have an associated address without a private key. If you have a wallet connected with a private key, use `/disconnect` instead.'
      }
    };
    
    // Get help information for the specific command
    const helpInfo = commandHelp[commandName];
    
    // Create an embed for the specific command help
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(helpInfo.title)
      .setDescription(helpInfo.description)
      .addFields(
        { name: '📝 Usage', value: helpInfo.usage },
        { name: '🔧 Options', value: helpInfo.options.map(option => `\`${option.name}\` - ${option.description}`).join('\n') },
        { name: '💡 Examples', value: helpInfo.examples.join('\n') }
      );
    
    if (helpInfo.warning) {
      embed.addFields({ name: '⚠️ Warning', value: helpInfo.warning });
    }
    
    if (helpInfo.note) {
      embed.addFields({ name: '📌 Note', value: helpInfo.note });
    }
    
    // Send the embed to the user
    await interaction.editReply({
      content: null,
      embeds: [embed],
      ephemeral: true
    });
  }
};
