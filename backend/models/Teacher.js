const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
    fullName: { type: String, default: "" },
    subjects: { type: [String], default: [] },
    classes: { type: [String], default: [] },
    achievements: { type: String, default: "" },
    teachingMode: { type: String, default: "" },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    experience: { type: String, default: "" }
}, {
    timestamps: true
});

module.exports = mongoose.model("Teacher", teacherSchema);
