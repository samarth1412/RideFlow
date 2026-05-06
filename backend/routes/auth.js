const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// @route   POST /api/auth/google-login
// @desc    Google OAuth login/signup
// @access  Public
router.post('/google-login', async (req, res) => {
  try {
    console.log('📨 Received Google login request:', req.body);
    
    const { googleId, email, name, picture } = req.body;

    // Validate input
    if (!googleId || !email || !name || !picture) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user exists
    let user = await User.findOne({ googleId: googleId });

    if (user) {
      console.log('Existing user found:', user.email);
      
      // Existing user - update last login
      user.lastLogin = Date.now();
      await user.save();

      // Generate token
      const token = generateToken(user._id);

      return res.json({
        message: 'Login successful',
        isNewUser: false,
        token,
        user: {
          id: user._id,
          googleId: user.googleId,
          email: user.email,
          name: user.name,
          picture: user.picture,
          originalPicture: user.originalPicture,
          profilePictureUpdatedAt: user.profilePictureUpdatedAt,
          phone: user.phone,
          address: user.address,
          city: user.city,
          role: user.role,
          hasListedVehicles: user.hasListedVehicles,
          isProfileComplete: user.isProfileComplete,
          walletBalance: user.walletBalance,
          isVerified: user.isVerified,
          verificationStatus: user.verificationStatus,
          citizenshipPhoto: user.citizenshipPhoto
        }
      });
    } else {
      console.log('Creating new user:', email);
      
      // New user - create account
      user = new User({
        googleId,
        email,
        name,
        picture,
        originalPicture: picture,
        isProfileComplete: false,
        role: 'user',
        hasListedVehicles: false
      });

      await user.save();
      console.log('New user created successfully');

      // Generate token
      const token = generateToken(user._id);

      return res.json({
        message: 'Account created successfully',
        isNewUser: true,
        token,
        user: {
          id: user._id,
          googleId: user.googleId,
          email: user.email,
          name: user.name,
          picture: user.picture,
          originalPicture: user.originalPicture,
          profilePictureUpdatedAt: user.profilePictureUpdatedAt,
          isProfileComplete: false,
          role: 'user',
          hasListedVehicles: false,
          walletBalance: user.walletBalance,
          isVerified: false,
          verificationStatus: 'NOT_SUBMITTED'
        }
      });
    }
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/complete-profile
// @desc    Complete user profile (new users only)
// @access  Private
router.post('/complete-profile', authMiddleware, async (req, res) => {
  try {
    const { phone, city } = req.body;

    // Validate input
    if (!phone || !city) {
      return res.status(400).json({ message: 'Phone and city are required' });
    }

    // Find user and update
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update profile
    user.phone = phone;
    user.city = city;
    user.isProfileComplete = true;

    await user.save();

    console.log('Profile completed for user:', user.email);

    res.json({
      message: 'Profile completed successfully',
      user: {
        id: user._id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        originalPicture: user.originalPicture,
        profilePictureUpdatedAt: user.profilePictureUpdatedAt,
        phone: user.phone,
        address: user.address,
        city: user.city,
        role: user.role,
        hasListedVehicles: user.hasListedVehicles,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        citizenshipPhoto: user.citizenshipPhoto,
        isProfileComplete: user.isProfileComplete,
        walletBalance: user.walletBalance
      }
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user data
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-__v');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        originalPicture: user.originalPicture,
        profilePictureUpdatedAt: user.profilePictureUpdatedAt,
        phone: user.phone,
        address: user.address,
        city: user.city,
        role: user.role,
        hasListedVehicles: user.hasListedVehicles,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        citizenshipPhoto: user.citizenshipPhoto,
        isProfileComplete: user.isProfileComplete,
        walletBalance: user.walletBalance,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/auth/profile
// @desc    Update basic profile info
// @access  Private
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, city } = req.body;

    if (!name && !phone && !city) {
      return res.status(400).json({ message: 'Provide at least one field to update' });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (city !== undefined) user.city = city;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        originalPicture: user.originalPicture,
        profilePictureUpdatedAt: user.profilePictureUpdatedAt,
        phone: user.phone,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        citizenshipPhoto: user.citizenshipPhoto,
        address: user.address,
        city: user.city,
        role: user.role,
        hasListedVehicles: user.hasListedVehicles,
        isProfileComplete: user.isProfileComplete,
        walletBalance: user.walletBalance,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/upload-profile-picture
// @desc    Upload profile picture (Cloudinary)
// @access  Private
router.post('/upload-profile-picture', authMiddleware, async (req, res) => {
  try {
    const { pictureUrl } = req.body;

    if (!pictureUrl) {
      return res.status(400).json({ message: 'Picture URL is required' });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Store original picture if this is first custom upload
    if (!user.originalPicture) {
      user.originalPicture = user.picture;
    }

    // Update user with new profile picture URL from Cloudinary
    user.picture = pictureUrl;
    user.profilePictureUpdatedAt = new Date();
    await user.save();

    res.json({
      message: 'Profile picture updated successfully',
      user: {
        id: user._id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        originalPicture: user.originalPicture,
        profilePictureUpdatedAt: user.profilePictureUpdatedAt,
        phone: user.phone,
        address: user.address,
        city: user.city,
        role: user.role,
        hasListedVehicles: user.hasListedVehicles,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        citizenshipPhoto: user.citizenshipPhoto,
        isProfileComplete: user.isProfileComplete,
        walletBalance: user.walletBalance
      }
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/upload-citizenship
// @desc    Upload citizenship photo for verification (Cloudinary)
// @access  Private
router.post('/upload-citizenship', authMiddleware, async (req, res) => {
  try {
    const { citizenshipUrl } = req.body;

    if (!citizenshipUrl) {
      return res.status(400).json({ message: 'Citizenship URL is required' });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user with citizenship photo URL from Cloudinary
    user.citizenshipPhoto = citizenshipUrl;
    user.verificationStatus = 'PENDING';
    user.isVerified = false;
    await user.save();

    res.json({
      message: 'Citizenship photo uploaded successfully. Awaiting admin verification.',
      user: {
        id: user._id,
        citizenshipPhoto: user.citizenshipPhoto,
        verificationStatus: user.verificationStatus,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Upload citizenship error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/pending-verifications
// @desc    Get all users pending verification (Admin only)
// @access  Private (Admin)
router.get('/pending-verifications', authMiddleware, async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId);

    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const pendingUsers = await User.find({
      verificationStatus: 'PENDING'
    }).select('name email phone city citizenshipPhoto verificationStatus createdAt');

    res.json({
      users: pendingUsers
    });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/verify-user/:userId
// @desc    Approve or reject user verification (Admin only)
// @access  Private (Admin)
router.post('/verify-user/:userId', authMiddleware, async (req, res) => {
  try {
    const { action } = req.body; // action: 'APPROVE' or 'REJECT'

    const adminUser = await User.findById(req.userId);

    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (action === 'APPROVE') {
      targetUser.isVerified = true;
      targetUser.verificationStatus = 'APPROVED';
    } else if (action === 'REJECT') {
      targetUser.isVerified = false;
      targetUser.verificationStatus = 'REJECTED';
    } else {
      return res.status(400).json({ message: 'Invalid action. Use APPROVE or REJECT' });
    }

    await targetUser.save();

    res.json({
      message: `User verification ${action.toLowerCase()}d successfully`,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        isVerified: targetUser.isVerified,
        verificationStatus: targetUser.verificationStatus
      }
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;