const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createRequest,
  getTeacherRequests,
  getStudentRequests,
  deleteRequest,
  acceptRequest,
  rejectRequest,
  createMeeting
} = require('../controllers/meetingController');

// student -> create req
router.post('/request', auth, createRequest);

// teacher > view (protected)
router.get('/teacher', auth, getTeacherRequests);

// student > view (protected)
router.get('/student', auth, getStudentRequests);

// student delete (protected) - frontend expects DELETE /meetings/request/:id
router.delete('/request/:id', auth, deleteRequest);

// teacher accept (protected)
router.patch('/:id/accept', auth, acceptRequest);

// teacher reject (protected)
router.patch('/:id/reject', auth, rejectRequest);

// manual meeting create (protected)
router.post('/create-meeting', auth, createMeeting);

// Generic respond endpoint used by frontend
router.put('/:id/respond', auth, (req, res, next) => {
  // lazy-load handler from controller to avoid circular requires
  const { respondToRequest } = require('../controllers/meetingController');
  return respondToRequest(req, res, next);
});
module.exports = router;
