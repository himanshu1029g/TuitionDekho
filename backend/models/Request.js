const mongoose = require('mongoose');
const { Schema } = mongoose;

const RequestSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending','Accepted','Rejected'], default: 'Pending' },
  scheduledAt: { type: Date },
  meetingLink: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', RequestSchema);
