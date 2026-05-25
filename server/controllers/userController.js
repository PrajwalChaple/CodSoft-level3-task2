const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get all users (for assigning tasks)
// @route   GET /api/users
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('name email avatar role createdAt');
  res.json({ success: true, count: users.length, data: users });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.name = req.body.name || user.name;
  user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;

  if (req.body.email) {
    // Check if email is already taken by another user
    const emailExists = await User.findOne({ email: req.body.email });
    if (emailExists && emailExists._id.toString() !== req.user._id.toString()) {
      res.status(400);
      throw new Error('Email already in use');
    }
    user.email = req.body.email;
  }

  const updatedUser = await user.save();

  res.json({
    success: true,
    data: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
    },
  });
});

// @desc    Change password
// @route   PUT /api/users/password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
});

module.exports = { getUsers, updateProfile, changePassword };
