const Tip = require('../models/Tip');
const { getDisplayNameForAddress } = require('./mappingUtils');
const { transferRLUSD } = require('./walletUtils');
const User = require('../models/User');
const { ethers } = require('ethers');

/**
 * Get the transaction URL on Etherscan
 * @param {string} txHash - Transaction hash
 * @returns {string} - Etherscan URL
 */
function getTransactionUrl(txHash) {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

/**
 * Get the address URL on Etherscan
 * @param {string} address - Ethereum address
 * @returns {string} - Etherscan URL
 */
function getAddressUrl(address) {
  return `https://sepolia.etherscan.io/address/${address}`;
}

/**
 * Send a tip from one user to another
 * @param {string} senderId - Discord ID of the sender
 * @param {string} recipientAddress - Ethereum address of the recipient
 * @param {string|number} amount - Amount of RLUSD to send
 * @param {string} message - Optional message with the tip
 * @returns {Promise<Object>} - Result of the operation
 */
async function sendTip(senderId, recipientAddress, amount, message = '') {
  try {
    console.log('sendTip called with:', { 
      senderId, 
      recipientAddress, 
      amount, 
      amountType: typeof amount,
      message 
    });

    // Find the sender's user record
    const sender = await User.findOne({ discordId: senderId });
    if (!sender) {
      return { 
        success: false, 
        message: 'You need to create a wallet first. Use /create-wallet to get started.' 
      };
    }

    // Validate the amount
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return { success: false, message: 'Amount must be greater than 0' };
    }

    // Ensure amount is a clean string (remove any non-numeric characters except decimal point)
    const cleanAmount = amount.toString().replace(/[^0-9.]/g, '');
    console.log('Clean amount for transfer:', cleanAmount);

    // Send the transaction
    const result = await transferRLUSD(sender.privateKey, recipientAddress, cleanAmount);
    console.log('Transfer result:', result);

    if (!result.success) {
      return { 
        success: false, 
        message: `Failed to send tip: ${result.error}`,
        code: result.code
      };
    }

    // Record the tip in the database
    const tip = new Tip({
      senderId,
      recipientAddress,
      amount: parseFloat(cleanAmount), // Store as number in database
      message,
      transactionHash: result.transactionHash,
      status: 'confirmed'
    });
    await tip.save();

    return {
      success: true,
      message: 'Tip sent successfully',
      transactionHash: result.transactionHash,
      transactionUrl: getTransactionUrl(result.transactionHash)
    };
  } catch (error) {
    console.error('Error sending tip:', error);
    return { 
      success: false, 
      message: 'Error sending tip: ' + (error.message || 'Unknown error')
    };
  }
}

/**
 * Get tip history for a user
 * @param {string} userId - Discord ID of the user
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Number of tips per page
 * @returns {Promise<Object>} - Tip history with pagination info
 */
async function getUserTipHistory(userId, page = 1, limit = 5) {
  try {
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get sent tips
    const sentTips = await Tip.find({ senderId: userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count of sent tips
    const totalSentTips = await Tip.countDocuments({ senderId: userId });

    // Get received tips (need to find user's address first)
    const user = await User.findOne({ discordId: userId });
    let receivedTips = [];
    let totalReceivedTips = 0;

    if (user) {
      receivedTips = await Tip.find({ recipientAddress: user.walletAddress.toLowerCase() })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

      totalReceivedTips = await Tip.countDocuments({ 
        recipientAddress: user.walletAddress.toLowerCase() 
      });
    }

    // Enhance the tips with display names
    const enhancedSentTips = await Promise.all(sentTips.map(async tip => {
      const displayName = await getDisplayNameForAddress(tip.recipientAddress);
      return {
        ...tip.toObject(),
        recipientDisplay: displayName
      };
    }));

    const enhancedReceivedTips = await Promise.all(receivedTips.map(async tip => {
      const senderUser = await User.findOne({ discordId: tip.senderId });
      return {
        ...tip.toObject(),
        senderDisplay: senderUser ? senderUser.username : 'Unknown User'
      };
    }));

    return {
      sent: {
        tips: enhancedSentTips,
        total: totalSentTips,
        page,
        limit,
        totalPages: Math.ceil(totalSentTips / limit)
      },
      received: {
        tips: enhancedReceivedTips,
        total: totalReceivedTips,
        page,
        limit,
        totalPages: Math.ceil(totalReceivedTips / limit)
      }
    };
  } catch (error) {
    console.error('Error getting user tip history:', error);
    return {
      sent: { tips: [], total: 0, page, limit, totalPages: 0 },
      received: { tips: [], total: 0, page, limit, totalPages: 0 }
    };
  }
}

/**
 * Get leaderboard data
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Number of users per page
 * @returns {Promise<Object>} - Leaderboard data with pagination info
 */
async function getLeaderboard(page = 1, limit = 5) {
  try {
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Aggregate to get top senders
    const topSenders = await Tip.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: {
          _id: '$senderId',
          totalSent: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalSent: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Get total counts for pagination
    const totalSenders = await Tip.aggregate([
      { $group: { _id: '$senderId' } },
      { $count: 'total' }
    ]);

    // Enhance the data with user information
    const enhancedSenders = await Promise.all(topSenders.map(async sender => {
      const user = await User.findOne({ discordId: sender._id });
      return {
        ...sender,
        username: user ? user.username : 'Unknown User',
        discordId: sender._id
      };
    }));

    // Pour les receveurs, nous allons d'abord récupérer toutes les transactions
    const allTips = await Tip.find({ status: 'confirmed' });
    
    // Créer un map pour stocker les informations par nom d'affichage
    const receiversByDisplayName = new Map();
    
    // Traiter chaque transaction pour regrouper par nom d'affichage
    await Promise.all(allTips.map(async tip => {
      const displayName = await getDisplayNameForAddress(tip.recipientAddress);
      
      if (!receiversByDisplayName.has(displayName)) {
        receiversByDisplayName.set(displayName, {
          displayName,
          totalReceived: 0,
          count: 0,
          addresses: new Set()
        });
      }
      
      const receiver = receiversByDisplayName.get(displayName);
      receiver.totalReceived += tip.amount;
      receiver.count += 1;
      receiver.addresses.add(tip.recipientAddress);
    }));
    
    // Convertir la map en tableau et trier par montant total reçu
    let topReceivers = Array.from(receiversByDisplayName.values())
      .sort((a, b) => b.totalReceived - a.totalReceived)
      .slice(skip, skip + limit)
      .map(receiver => ({
        _id: Array.from(receiver.addresses)[0], // Utiliser la première adresse comme ID
        displayName: receiver.displayName,
        totalReceived: receiver.totalReceived,
        count: receiver.count,
        addresses: Array.from(receiver.addresses)
      }));
    
    // Calculer le nombre total de receveurs uniques pour la pagination
    const totalReceivers = receiversByDisplayName.size;

    return {
      senders: {
        data: enhancedSenders,
        total: totalSenders.length > 0 ? totalSenders[0].total : 0,
        page,
        limit,
        totalPages: Math.ceil((totalSenders.length > 0 ? totalSenders[0].total : 0) / limit)
      },
      receivers: {
        data: topReceivers,
        total: totalReceivers,
        page,
        limit,
        totalPages: Math.ceil(totalReceivers / limit)
      }
    };
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return {
      senders: { data: [], total: 0, page, limit, totalPages: 0 },
      receivers: { data: [], total: 0, page, limit, totalPages: 0 }
    };
  }
}

module.exports = {
  getTransactionUrl,
  getAddressUrl,
  sendTip,
  getUserTipHistory,
  getLeaderboard
}; 