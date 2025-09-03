const mongoose = require("mongoose");

// Define User schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// Create and export the User model
const User = mongoose.model("User", userSchema);
module.exports = User;
