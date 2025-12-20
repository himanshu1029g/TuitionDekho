const Teacher = require('../models/Teacher');

const mongoose = require('mongoose');


/**
 * INTERNAL: ensure teacher profile exists
 * (does NOT expose new route)
 */
const ensureTeacherProfile = async (userId) => {
  let teacher = await Teacher.findOne({ userId });
  if (!teacher) {
    teacher = await Teacher.create({ userId });
  }
  return teacher;
};



/**
 * Create teacher profile (one-time)
 */
const createTeacherProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const existing = await Teacher.findOne({ userId });
    if (existing) {
      return res.status(400).json({ message: 'Teacher profile already exists' });
    }

    const body = { ...req.body };

    if (Array.isArray(body.subjects)) body.subjects = body.subjects.join(',');
    if (Array.isArray(body.classes)) body.classes = body.classes.join(',');

    const profile = await Teacher.create({
      userId,
      ...body
    });

    return res.status(201).json({
      success: true,
      profile
    });
  } catch (err) {
    console.error('createTeacherProfile error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update OR auto-create teacher profile (SAFE FIX)
 */
const updateTeacherProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // 🔑 critical fix
    const teacher = await ensureTeacherProfile(userId);

    const update = {
      subjects: Array.isArray(req.body.subjects)
        ? req.body.subjects.join(',')
        : req.body.subjects ?? teacher.subjects,

      classes: Array.isArray(req.body.classes)
        ? req.body.classes.join(',')
        : req.body.classes ?? teacher.classes,

      experience: req.body.experience ?? teacher.experience,
      qualifications: req.body.qualifications ?? teacher.qualifications,
      location: req.body.location ?? teacher.location,
      mode: req.body.mode ?? teacher.mode,
      bio: req.body.bio ?? teacher.bio,

      achievements: Array.isArray(req.body.achievements)
        ? req.body.achievements
        : teacher.achievements
    };

    Object.assign(teacher, update);
    await teacher.save();

    const populated = await Teacher.findOne({ userId })
      .populate('userId', 'name email phone');

    return res.json({
      success: true,
      profile: populated
    });
  } catch (err) {
    console.error('updateTeacherProfile error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get teacher profile by teacher _id (student view)
 */
const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findById(id)
      .populate('userId', 'name email phone');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    return res.json({
      success: true,
      teacher
    });
  } catch (err) {
    console.error('getTeacherById error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get number of accepted students for a teacher (student-facing stat)
 */
const getTeacherStudentsCount = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    const MeetingRequest = require('../models/MeetingRequest');
    const count = await MeetingRequest.countDocuments({ teacherId: teacher.userId, status: 'accepted' });

    return res.json({ success: true, count });
  } catch (err) {
    console.error('getTeacherStudentsCount error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get teacher profile by logged-in user (teacher dashboard)
 * 🔧 FIX: auto-create instead of 404
 */
const getMyTeacherProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const teacher = await ensureTeacherProfile(userId);

    const populated = await Teacher.findOne({ userId })
      .populate('userId', 'name email phone');

    return res.json({
      success: true,
      teacher: populated
    });
  } catch (err) {
    console.error('getMyTeacherProfile error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Search teachers (student)
 */
const searchTeachers = async (req, res) => {
  try {
    const { subject, class: className, location, mode } = req.query;
    const query = {};

    if (subject) query.subjects = { $regex: subject, $options: 'i' };
    if (className) query.classes = { $regex: className, $options: 'i' };
    if (mode) query.mode = { $regex: mode, $options: 'i' };

    if (location) {
      query.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.state': { $regex: location, $options: 'i' } },
        { location: { $regex: location, $options: 'i' } }
      ];
    }

    const teachers = await Teacher.find(query)
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      teachers
    });
  } catch (err) {
    console.error('searchTeachers error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
const getTeacherProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const teacher = await Teacher.findOne({ userId })
      .populate('userId', 'name email phone');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    return res.json({
      success: true,
      profile: teacher
    });
  } catch (err) {
    console.error('getTeacherProfileByUserId error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};




module.exports = {
  createTeacherProfile,
  updateTeacherProfile,
  getTeacherById,
  getTeacherStudentsCount,
  getMyTeacherProfile,
  searchTeachers,
  getTeacherProfileByUserId,
  ensureTeacherProfile 
};
