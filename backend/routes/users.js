const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all users (for assigning tasks / adding members)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
