const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Teacher = require('../models/Teacher');

// reset feature add 
const crypto = require("crypto");
// const User = require("../models/User");
const PasswordResetToken = require("../models/PasswordResetToken");
const { sendResetEmail } = require("../services/emailService");


const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role,
      phone
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    let profile = { ...user.toObject() };

    if (user.role === 'teacher') {
      const teacherProfile = await Teacher.findOne({ userId: user._id });
      if (teacherProfile) {
        profile.teacherProfile = teacherProfile;
      }
    }

    res.json({ success: true, user: profile });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// add resert password feature ..

 const forgotPassword = async (req, res) => {

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400)
        .json({
          message: "Email is required"
        });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    await PasswordResetToken.deleteMany({ userId: user._id });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 15 * 60 * 1000;


    await PasswordResetToken.create({
      userId: user._id,
      token,
      expiresAt,
    })

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;


    await sendResetEmail(email, resetLink);

    res.json({
      message: "Reset Link sent to email by contoller."
    });


  } catch (err) {
    console.error("Forgot password error: ", err);
    res.status(500).json({ message: "Server error" });
  }
};

 const validateResetToken = async (req, res) => {

  try {
    const { token } = req.params;

    const record = await PasswordResetToken.findOne({ token });
    if (!record || record.expiresAt < Date.now())
      return res.status(400).json({ message: "Invalid or expired token" });

    res.json({ valid: true });
  } catch (err) {
    console.error("Validate token error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

 const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const record = await PasswordResetToken.findOne({ token });

    if (!record || record.expiresAt < Date.now())
      return res.status(400).json({ message: "Invalid or expired token" });

    const user = await User.findById(record.userId);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    // bcrypt middleware will hash automatically
    user.password = password;
    await user.save();

    await PasswordResetToken.deleteMany({ userId: user._id });

    res.json({ message: "Password reset successful!" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports  = {
  registerUser,
  loginUser,
  getProfile,
  forgotPassword,
  validateResetToken,
  resetPassword
};
