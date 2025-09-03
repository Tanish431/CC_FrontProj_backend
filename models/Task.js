const mongoose = require("mongoose");

// Define Task schema
const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  due: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["not-started", "in-progress", "done"],
    default: "not-started",
  },
});

// Create and export the Task model
const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
