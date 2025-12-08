const MeetingRequest = require('../models/MeetingRequest');

const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    const pendingRequests = await MeetingRequest.countDocuments({ 
      studentId, 
      status: 'pending' 
    });
    
    const acceptedRequests = await MeetingRequest.countDocuments({ 
      studentId, 
      status: 'accepted' 
    });
    
    const completedSessions = await MeetingRequest.countDocuments({ 
      studentId, 
      status: 'completed' 
    });

    const recentRequests = await MeetingRequest.find({ studentId })
      .populate('teacherId', 'name')
      .populate('teacherProfileId', 'subjects')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      dashboard: {
        pendingRequests,
        acceptedRequests,
        completedSessions,
        recentRequests
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getStudentRequests = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = { studentId };
    if (status) query.status = status;

    const requests = await MeetingRequest.find(query)
      .populate('teacherId', 'name email')
      .populate('teacherProfileId', 'subjects rating')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MeetingRequest.countDocuments(query);

    res.json({
      success: true,
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getStudentDashboard,
  getStudentRequests
};
