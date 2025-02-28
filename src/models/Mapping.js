const mongoose = require('mongoose');

const mappingSchema = new mongoose.Schema({
  // Can be either a Discord user ID or an alias
  identifier: {
    type: String,
    required: true,
    unique: true
  },
  // Type of identifier: 'user' for Discord users, 'alias' for custom aliases
  identifierType: {
    type: String,
    enum: ['user', 'alias'],
    required: true
  },
  // The Ethereum address mapped to this identifier
  address: {
    type: String,
    required: true
  },
  // Who created this mapping
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update the modification date
mappingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Mapping', mappingSchema); 