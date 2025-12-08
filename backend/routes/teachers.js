const express = require('express');
const { 
  createTeacherProfile, 
  updateTeacherProfile, 
  searchTeachers, 
  getTeacherProfile,
  getTeacherProfileByUserId
} = require('../controllers/teacherController');
const { teacherProfileValidation } = require('../middleware/validation');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/profile', auth, teacherProfileValidation, createTeacherProfile);
router.put('/profile', auth, updateTeacherProfile);
router.get('/search', searchTeachers);
router.get('/user/:userId', getTeacherProfileByUserId); // New route
router.get('/:id', getTeacherProfile);

module.exports = router;
