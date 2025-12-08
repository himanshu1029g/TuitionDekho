const Teacher = require('../models/Teacher');
const User = require('../models/User');

const createTeacherProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if teacher profile already exists
    const existingProfile = await Teacher.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({ message: 'Teacher profile already exists' });
    }

    // normalize subjects/classes to strings (frontend may send arrays or CSV strings)
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

const updateTeacherProfile = async (req, res) => {
  try {
    console.debug('updateTeacherProfile called by', req.user?._id, 'body=', req.body);
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

    // First find or create the teacher profile
    let teacherProfile = await Teacher.findOne({ userId });

    if (!teacherProfile) {
      // If no profile exists, create one
      const bodySubjects = Array.isArray(subjects) ? subjects.join(',') : (subjects || '');
      const bodyClasses = Array.isArray(classes) ? classes.join(',') : (classes || '');
      teacherProfile = new Teacher({
        userId,
        subjects: bodySubjects,
        classes: bodyClasses,
        experience,
        qualifications,
        location,
        mode,
        bio,
        achievements: Array.isArray(achievements) ? achievements : []
      });
    } else {
      // Update existing profile
      teacherProfile.subjects = Array.isArray(subjects) ? subjects.join(',') : (subjects || '');
      teacherProfile.classes = Array.isArray(classes) ? classes.join(',') : (classes || '');
      teacherProfile.experience = experience;
      teacherProfile.qualifications = qualifications;
      teacherProfile.location = location;
      teacherProfile.mode = mode;
      teacherProfile.bio = bio;
      teacherProfile.achievements = Array.isArray(achievements) ? achievements : [];
    }

    await teacherProfile.save();

    // Get the updated profile with user details
    const updatedProfile = await Teacher.findOne({ userId })
      .populate('userId', 'name email phone');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile
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


const searchTeachers = async (req, res) => {
  try {
    const { subject, class: className, location, mode, page = 1, limit = 20 } = req.query;

    const query = {};

    // flexible matching for subjects/classes
    if (subject && subject.trim()) {
      query.$or = [
        { subjects: { $regex: subject, $options: 'i' } },
        { subject: { $regex: subject, $options: 'i' } }
      ];
    }

    if (className && className.trim()) {
      query.$and = (query.$and || []);
      query.$and.push({
        $or: [
          { classes: { $regex: className, $options: 'i' } },
          { class: { $regex: className, $options: 'i' } }
        ]
      });
    }

    if (mode && mode.trim()) {
      const m = mode.toLowerCase();
      query.mode = m === 'both' ? { $in: ['both', 'online', 'offline'] } : { $regex: m, $options: 'i' };
    }

    if (location && location.trim()) {
      query.$and = (query.$and || []);
      query.$and.push({
        $or: [
          { city: { $regex: location, $options: 'i' } },
          { 'location.city': { $regex: location, $options: 'i' } },
          { address: { $regex: location, $options: 'i' } }
        ]
      });
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [teachers, total] = await Promise.all([
      Teacher.find(query)
        .populate('userId', 'name email phone')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .sort({ rating: -1, createdAt: -1 }),
      Teacher.countDocuments(query)
    ]);

    return res.json({ success: true, total, teachers, currentPage: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error('searchTeachers error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
const getTeacherProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findById(id)
      .populate('userId', 'name email phone');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Ensure strings are returned even if empty
    const response = {
      success: true,
      teacher: {
        ...teacher.toObject(),
        subjects: teacher.subjects || '',
        classes: teacher.classes || '',
        qualifications: teacher.qualifications || '',
        bio: teacher.bio || '',
        location: teacher.location || { city: '', state: '', address: '' }
      }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getTeacherProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const teacher = await Teacher.findOne({ userId })
      .populate('userId', 'name email phone');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found for this user' });
    }

    const response = {
      success: true,
      teacher: {
        ...teacher.toObject(),
        subjects: teacher.subjects || '',
        classes: teacher.classes || '',
        qualifications: teacher.qualifications || '',
        bio: teacher.bio || '',
        location: teacher.location || { city: '', state: '', address: '' }
      }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createTeacherProfile,
  updateTeacherProfile,
  searchTeachers,
  getTeacherProfile,
  getTeacherProfileByUserId
};
