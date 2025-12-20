const router = require("express").Router();
const CallLog = require("../models/CallLog");
const auth = require("../middleware/auth");

router.get("/my", auth, async (req, res) => {
  const userId = req.user.id;

  // return both incoming and outgoing logs
  const logs = await CallLog.find({
    $or: [{ toUserId: userId }, { 'fromUser.id': userId }]
  }).sort({ createdAt: -1 }).lean();

  // collect other user ids (toUserId may be an id string)
  const otherIds = new Set();
  logs.forEach(l => {
    if (String(l.toUserId) !== String(userId)) otherIds.add(String(l.toUserId));
    if (l.fromUser && String(l.fromUser.id) !== String(userId)) otherIds.add(String(l.fromUser.id));
  });

  const User = require('../models/User');
  const users = otherIds.size ? await User.find({ _id: { $in: Array.from(otherIds) } }).select('name') : [];
  const userMap = {};
  users.forEach(u => { userMap[String(u._id)] = u.name; });

  const enriched = logs.map(l => {
    const isIncoming = String(l.toUserId) === String(userId);
    const otherId = isIncoming ? (l.fromUser && l.fromUser.id) : l.toUserId;

    // if incoming, prefer the stored fromUser.name, otherwise use the userMap lookup for toUserId
    let otherName = null;
    if (isIncoming) {
      otherName = (l.fromUser && l.fromUser.name) || userMap[String(otherId)] || String(otherId);
    } else {
      otherName = userMap[String(otherId)] || (l.fromUser && l.fromUser.name) || String(otherId);
    }

    return {
      ...l,
      otherUserId: otherId,
      otherUserName: otherName,
      isIncoming
    };
  });

  res.json(enriched);
});

module.exports = router;
