const express = require('express');
const { registerUser, loginUser, getProfile } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validation');
const auth = require('../middleware/auth');

// reset feature ad
const {
  forgotPassword,
  validateResetToken,
  resetPassword,
} = require("../controllers/authController");


const router = express.Router();

router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);
router.get('/profile', auth, getProfile);

router.post("/forgot-password", forgotPassword);
router.get("/validate-reset/:token", validateResetToken);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
