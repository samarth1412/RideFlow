const User = require('../models/User');

// Optional middleware — enforce verified accounts only on routes that include it.
// Booking and add-vehicle flows leave verification as UI/trust-badge only (not required).
const verifyUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Account not verified. Please upload your citizenship document and wait for admin approval.',
        verificationStatus: user.verificationStatus,
        rejectionReason: user.rejectionReason
      });
    }

    next();
  } catch (error) {
    console.error('Verification check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = verifyUser;
