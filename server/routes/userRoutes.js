const express = require('express');
const router = express.Router();
const {
  getUsers,
  updateProfile,
  changePassword,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.get('/', getUsers);
router.put('/profile', updateProfile);
router.put('/password', changePassword);

module.exports = router;
