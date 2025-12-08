const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // e.g., 'meeting_response', 'new_request'
  message: { type: String, required: true },
  relatedRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'MeetingRequest' },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
