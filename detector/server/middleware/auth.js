const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protects routes that require a valid JWT.
 * On success attaches a lean user object to req.user (no password).
 */
const auth = async (req, res, next) => {
  try {
    const header = req.header('Authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.userId) {
      return res.status(401).json({ message: 'Token is not valid or has expired' });
    }

    const user = await User.findById(decoded.userId).select('-password').lean();
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Normalize shape so frontend always sees `id` (not only `_id`)
    req.user = {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid or has expired' });
  }
};

module.exports = auth;
