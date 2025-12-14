const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {
  createTeacherProfile,
  updateTeacherProfile,
  getTeacherById,
  getMyTeacherProfile,
  searchTeachers,
  getTeacherProfileByUserId
} = require('../controllers/teacherController');

// student
router.get('/search', searchTeachers);
router.get('/:id', getTeacherById);

// teacher
router.get('/me/profile', auth, getMyTeacherProfile);

// 🔥 ADD THIS (for dashboard load)
router.get('/user/:userId', auth, getTeacherProfileByUserId);

router.post('/profile', auth, createTeacherProfile);
router.put('/profile', auth, updateTeacherProfile);

module.exports = router;
