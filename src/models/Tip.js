const mongoose = require('mongoose');

const tipSchema = new mongoose.Schema({
  // Discord ID of the sender
  senderId: {
    type: String,
    required: true
  },
  // Ethereum address of the recipient
  recipientAddress: {
    type: String,
    required: true
  },
  // Amount of RLUSD sent
  amount: {
    type: Number,
    required: true
  },
  // Optional message with the tip
  message: {
    type: String,
    default: ''
  },
  // Transaction hash on the blockchain
  transactionHash: {
    type: String,
    required: true,
    unique: true
  },
  // Status of the transaction: 'pending', 'confirmed', 'failed'
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  // Timestamp of the tip
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Tip', tipSchema); 