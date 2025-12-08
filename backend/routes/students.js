const express = require('express');
const { getStudentDashboard, getStudentRequests } = require('../controllers/studentController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', auth, getStudentDashboard);
router.get('/requests', auth, getStudentRequests);

module.exports = router;
