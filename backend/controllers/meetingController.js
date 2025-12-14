const MeetingRequest = require('../models/MeetingRequest');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const { ensureTeacherProfile } = require('./teacherController');



const { v4: uuidv4 } = require('uuid');

// ============================
// Create meeting request (Student → Teacher)
// ============================
const createRequest = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const studentId = req.user._id;
    const {
      teacherId,
      teacherProfileId,
      subject,
      class: className,
      mode,
      message
    } = req.body;

    const missing = [];
    if (!teacherId) missing.push('teacherId');
    if (!subject?.trim()) missing.push('subject');
    if (!className?.trim()) missing.push('class');
    if (!mode) missing.push('mode');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing fields: ${missing.join(', ')}`
      });
    }

    // 🔑 ensure teacher profile exists
    const teacherProfile =
      teacherProfileId
        ? await Teacher.findById(teacherProfileId)
        : await ensureTeacherProfile(teacherId);

    const request = await MeetingRequest.create({
      studentId,
      teacherId,
      teacherProfileId: teacherProfile._id,
      subject,
      class: className,
      mode,
      message,
      status: 'pending'
    });

    await request.populate('studentId', 'name email');

    return res.status(201).json({
      success: true,
      request
    });
  } catch (err) {
    console.error('createRequest error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================
// Get requests for logged-in Teacher
// ============================
const getTeacherRequests = async (req, res) => {
  try {
    const teacherUserId = req.user._id;

    // ensure profile exists (safe)
    await ensureTeacherProfile(teacherUserId);

    const requests = await MeetingRequest.find({ teacherId: teacherUserId })
      .sort({ createdAt: -1 })
      .populate('studentId', 'name email')
      .populate('teacherProfileId');

    return res.json({ success: true, requests });
  } catch (err) {
    console.error('getTeacherRequests error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


// ============================
// Get requests for logged-in Student
// ============================
const getStudentRequests = async (req, res) => {
  try {
    const studentUserId = req.user._id;

    const requests = await MeetingRequest.find({
      studentId: studentUserId
    })
      .sort({ createdAt: -1 })
      .populate('teacherId', 'name email')
      .populate('teacherProfileId');

    return res.json({ success: true, requests });
  } catch (err) {
    console.error('getStudentRequests error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================
// Delete request (Student)
// ============================
const deleteRequest = async (req, res) => {
  try {
    const removed = await MeetingRequest.findOneAndDelete({
      _id: req.params.id,
      studentId: req.user._id
    });

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or unauthorized'
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('deleteRequest error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================
// Teacher Accept Request
// ============================
const acceptRequest = async (req, res) => {
  try {
    const request = await MeetingRequest.findOne({
      _id: req.params.id,
      teacherId: req.user._id
    });

    if (!request)
      return res.status(404).json({ success: false, message: 'Not found' });

    const meetingUrl = `https://meet.jit.si/${uuidv4()}`;
    request.status = 'accepted';
    request.meetingLink = meetingUrl;

    await request.save();

    return res.json({ success: true, meetingUrl });
  } catch (err) {
    console.error('acceptRequest error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================
// Teacher Reject Request
// ============================
const rejectRequest = async (req, res) => {
  try {
    const request = await MeetingRequest.findOne({
      _id: req.params.id,
      teacherId: req.user._id
    });

    if (!request)
      return res.status(404).json({ success: false, message: 'Not found' });

    request.status = 'rejected';
    await request.save();

    return res.json({ success: true });
  } catch (err) {
    console.error('rejectRequest error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================
// Create standalone meeting
// ============================
const createMeeting = async (req, res) => {
  try {
    const meetingUrl = `https://meet.jit.si/${uuidv4()}`;
    return res.json({ success: true, meetingUrl });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createRequest,
  getTeacherRequests,
  getStudentRequests,
  deleteRequest,
  acceptRequest,
  rejectRequest,
  createMeeting
};
