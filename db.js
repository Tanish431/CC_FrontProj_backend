const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// Create a User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
// Create a Task Schema
const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  due: { type: Date, required: true },
  status: { type: String, enum: ["not-started", "in-progress", "done"], default: "not-started" },
});

// Create User Model
const User = mongoose.model("User", userSchema);
const Task = mongoose.model("Task", taskSchema);

module.exports = {
  User: require("./models/User"),
  Task: require("./models/Task"),
};
