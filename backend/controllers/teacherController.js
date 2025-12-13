const Teacher = require('../models/Teacher');
const User = require('../models/User');

/**
 * CREATE TEACHER PROFILE
 */
const createTeacherProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const existingProfile = await Teacher.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({ message: 'Teacher profile already exists' });
    }

    const body = { ...req.body };
    if (Array.isArray(body.subjects)) body.subjects = body.subjects.join(',');
    if (Array.isArray(body.classes)) body.classes = body.classes.join(',');

    const teacherProfile = new Teacher({
      userId,
      ...body
    });

    await teacherProfile.save();

    res.status(201).json({
      success: true,
      message: 'Teacher profile created successfully',
      profile: teacherProfile
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * UPDATE TEACHER PROFILE
 */
const updateTeacherProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      subjects,
      classes,
      experience,
      qualifications,
      location,
      mode,
      bio,
      achievements
    } = req.body;

    let teacherProfile = await Teacher.findOne({ userId });

    if (!teacherProfile) {
      teacherProfile = new Teacher({
        userId,
        subjects: Array.isArray(subjects) ? subjects.join(',') : subjects,
        classes: Array.isArray(classes) ? classes.join(',') : classes,
        experience,
        qualifications,
        location,
        mode,
        bio,
        achievements: Array.isArray(achievements) ? achievements : []
      });
    } else {
      teacherProfile.subjects = Array.isArray(subjects) ? subjects.join(',') : subjects;
      teacherProfile.classes = Array.isArray(classes) ? classes.join(',') : classes;
      teacherProfile.experience = experience;
      teacherProfile.qualifications = qualifications;
      teacherProfile.location = location;
      teacherProfile.mode = mode;
      teacherProfile.bio = bio;
      teacherProfile.achievements = Array.isArray(achievements) ? achievements : [];
    }

    await teacherProfile.save();

    const populatedProfile = await Teacher.findOne({ userId })
      .populate('userId', 'name email phone');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: populatedProfile
    });
  } catch (error) {
    console.error('Update teacher profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * SEARCH TEACHERS
 */
const searchTeachers = async (req, res) => {
  try {
    const { subject, class: className, location, mode, page = 1, limit = 20 } = req.query;
    const query = {};

    if (subject) {
      query.subjects = { $regex: subject, $options: 'i' };
    }

    if (className) {
      query.classes = { $regex: className, $options: 'i' };
    }

    if (mode) {
      query.mode = mode.toLowerCase() === 'both'
        ? { $in: ['online', 'offline', 'both'] }
        : { $regex: mode, $options: 'i' };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.min(parseInt(limit), 100);

    const [teachers, total] = await Promise.all([
      Teacher.find(query)
        .populate('userId', 'name email phone')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Teacher.countDocuments(query)
    ]);

    res.json({
      success: true,
      total,
      teachers,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('searchTeachers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET TEACHER PROFILE BY USER ID
 */
const getTeacherProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const teacher = await Teacher.findOne({ userId })
      .populate('userId', 'name email phone');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    res.json({ success: true, teacher });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createTeacherProfile,
  updateTeacherProfile,
  searchTeachers,
  getTeacherProfileByUserId
};
