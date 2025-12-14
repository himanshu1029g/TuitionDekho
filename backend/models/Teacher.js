const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    subjects: {
      type: String,
      default: ''
    },

    classes: {
      type: String,
      default: ''
    },

    achievements: {
      type: [String],
      default: []
    },

    experience: {
      type: String,
      default: ''
    },

    qualifications: {
      type: String,
      default: ''
    },

    bio: {
      type: String,
      default: ''
    },

    mode: {
      type: String,
      enum: ['online', 'offline', 'both'],
      default: 'both'
    },

    location: {
      city: { type: String, default: '' },
      state: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Teacher', TeacherSchema);
