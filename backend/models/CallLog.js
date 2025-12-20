const mongoose = require("mongoose");

const callLogSchema = new mongoose.Schema({
  fromUser: {
    id: String,
    name: String,
    role: String
  },
  toUserId: String,
  roomId: String,
  status: {
    type: String,
    enum: ["started", "ringing", "answered", "missed", "rejected"],
    default: "started"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("CallLog", callLogSchema);
