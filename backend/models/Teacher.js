const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    subjects: {
        type: String,
        require: true,

    },
    classes: {
        type: String,
        require: true,

    },
    experience: {
        type: String,
        require: true,

    },
    qualifications: {
        type: String,
        require: true,
    },
    achievements: {
        type: [String],
        default: [],
    },
    location: {
        city: String,
        state: String,
        address: String,
    }, 
    mode: {
        type: String,
        enum: ['online', 'offline', 'both'],
        required: true
    },
    availability: {
        type: String,
        default: 'Flexible'
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    bio: {
        type: String,
        maxlength: 500
    },

    profileImage: {
        type: String
    },



}, {
    timestamps: true
});

module.exports = mongoose.model("Teacher", teacherSchema);