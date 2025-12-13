const express = require('express');
const auth = require('../middleware/auth'); // use your existing auth middleware
const { getOrCreateChat, getMessages, getChatListForUser } = require('../controllers/chatController');

const router = express.Router();

router.post('/', auth, getOrCreateChat);
router.get('/:roomId/messages', auth, getMessages);
router.get('/user/:userId/list', auth, getChatListForUser);

module.exports = router;
