const mongoose = require('mongoose');

const meetingRequestSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teacherProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    class: {
        type: String,
        required: true
    },
    mode: {
        type: String,
        enum: ['online', 'offline','no preference'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected','declined', 'completed'],
        default: 'pending'
    },
    message: String,
    teacherResponse: String,
    scheduledDate: Date,
    scheduledTime: String,
    meetingLink: String,
    address: String,
    respondedAt: Date,
    completedAt: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('MeetingRequest', meetingRequestSchema);