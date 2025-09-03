require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { User } = require('./db');
const { Task } = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: 'https://cctodo.netlify.app', 
    credentials: true,
  })
);

app.use(bodyParser.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Backend is running!",
    timestamp: new Date().toISOString(),
  });
});

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Sign-up Route
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: { id: newUser._id, username, email },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Sign-in Route
app.post("/api/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Set user in JWT for authentication
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    const token = req.headers["x-admin-token"];
    if (!token || token !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const users = await User.find({}, "username email");
    res.json({ totalUsers: users.length, users });
  } catch (err) {
    console.error("Admin fetch error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Task routes
app.get("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id });
    res.json(tasks);
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const { title, due, status } = req.body;

    const newTask = new Task({
      userId: req.user.id,
      title,
      due,
      status,
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.put("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, due, status } = req.body;

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: { title, due, status } },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found or unauthorized" });
    }

    res.json(updatedTask);
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTask = await Task.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found or unauthorized" });
    }

    res.status(204).send();
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
