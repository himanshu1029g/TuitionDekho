const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const User = require('../models/User'); // assuming a User model exists
const { v4: uuidv4 } = require('uuid');

/**
 * Student creates a request to a teacher
 * body: { teacherId, scheduledAt (optional) }
 * must have req.user set (authentication assumed)
 */
router.post('/', async (req, res, next) => {
  try {
    const studentId = req.user && req.user._id;
    const { teacherId, scheduledAt } = req.body;
    if (!studentId) return res.status(401).json({ message: 'Unauthorized' });
    if (!teacherId) return res.status(400).json({ message: 'teacherId required' });

    const reqDoc = await Request.create({
      student: studentId,
      teacher: teacherId,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
    });



    res.status(201).json(reqDoc);
  } catch (err) { next(err); }
});

/**
 * Teacher lists requests for them
 */
router.get('/teacher', async (req, res, next) => {
  try {
    const teacherId = req.user && req.user._id;
    if (!teacherId) return res.status(401).json({ message: 'Unauthorized' });

    const requests = await Request.find({ teacher: teacherId }).populate('student', 'name email');
    res.json(requests);
  } catch (err) { next(err); }
});

/**
 * Teacher accept/reject a request
 * body: { action: 'accept'|'reject', scheduledAt (optional) }
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const teacherId = req.user && req.user._id;
    if (!teacherId) return res.status(401).json({ message: 'Unauthorized' });

    const { action, scheduledAt } = req.body;
    const id = req.params.id;
    const reqDoc = await Request.findById(id);
    if (!reqDoc) return res.status(404).json({ message: 'Request not found' });
    if (String(reqDoc.teacher) !== String(teacherId)) return res.status(403).json({ message: 'Forbidden' });

    if (action === 'accept') {
      reqDoc.status = 'Accepted';
      if (scheduledAt) reqDoc.scheduledAt = new Date(scheduledAt);
      // create a meeting link token (placeholder). Users should replace with real SDK integration.
      reqDoc.meetingLink = process.env.MEETING_BASE_URL ? process.env.MEETING_BASE_URL + '/' + uuidv4() : 'https://meet.example.com/' + uuidv4();
      await reqDoc.save();


    } else if (action === 'reject') {
      reqDoc.status = 'Rejected';
      await reqDoc.save();

    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    res.json(reqDoc);
  } catch (err) { next(err); }
});

module.exports = router;
