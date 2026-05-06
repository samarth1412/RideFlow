const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Google OAuth Data
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  picture: {
    type: String,
    required: true
  },
  originalPicture: {
    type: String,
    default: null
  },
  profilePictureUpdatedAt: {
    type: Date,
    default: null
  },
  
  // Additional User Details (filled after first login)
  phone: {
    type: String,
    default: null
  },
  address: {
    type: String,
    default: null
  },
  city: {
    type: String,
    default: null
  },
  
  // Profile Status
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  
  // Citizenship Verification
  citizenshipPhoto: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'NOT_SUBMITTED'],
    default: 'NOT_SUBMITTED'
  },
  
  // User role - can be changed later through settings
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // Track if user has listed vehicles (computed field)
  hasListedVehicles: {
    type: Boolean,
    default: false
  },
  
  // Demo wallet balance (for demo payments)
  walletBalance: {
    type: Number,
    default: 1000,
    min: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

// Virtual field to check if user is an owner
userSchema.virtual('isOwner').get(function() {
  return this.hasListedVehicles;
});

// Ensure virtual fields are included when converting to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);