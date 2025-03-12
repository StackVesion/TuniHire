const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  instructor: { type: String },
  duration: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Course", CourseSchema);
