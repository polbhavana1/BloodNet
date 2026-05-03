const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    // Get user from the auth middleware (already attached to req.user)
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    // Check if user is verified
    if (!user.verified) {
      return res.status(403).json({ message: 'Account is not verified' });
    }

    // Attach admin user info to request
    req.admin = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Server error during admin authentication' });
  }
};

module.exports = adminAuth;
