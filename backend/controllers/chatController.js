const Message = require('../models/Message');
const mongoose = require('mongoose');

function makeRoomId(idA, idB) {
  if (!idA || !idB) return null;
  return idA < idB ? `chat_${idA}_${idB}` : `chat_${idB}_${idA}`;
}

// POST /api/chats  { studentId, teacherId }
const getOrCreateChat = async (req, res) => {
  try {
    const { studentId, teacherId } = req.body;
    if (!studentId || !teacherId) return res.status(400).json({ message: 'studentId and teacherId required' });
    const roomId = makeRoomId(studentId, teacherId);
    return res.json({ roomId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/chats/:roomId/messages?page=1&limit=50
const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    let { page = 1, limit = 50 } = req.query;
    page = Number(page);
    limit = Number(limit);

    const messages = await Message.find({ roomId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({ messages: messages.reverse() }); // chronological order
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/chats/user/:userId/list
const getChatListForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const objectId = mongoose.Types.ObjectId(userId);

    const pipeline = [
      { $match: { $or: [{ senderId: objectId }, { recipientId: objectId }] } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$roomId', lastMessage: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$lastMessage' } },
      { $sort: { createdAt: -1 } }
    ];

    const lastMessages = await Message.aggregate(pipeline);
    res.json({ chats: lastMessages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  makeRoomId,
  getOrCreateChat,
  getMessages,
  getChatListForUser
};
