const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// Export the models
module.exports = {
  User: require("./models/User"),
  Task: require("./models/Task"),
};
