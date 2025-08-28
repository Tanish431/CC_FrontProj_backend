require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { users, tasks } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(bodyParser.json());

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
app.post('/api/auth/signup', (req, res) => {
  const { username, email, password } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  const newUser = { id: Date.now(), username, email, password };
  users.push(newUser);
  res.status(201).json({ message: 'User created successfully', user: { id: newUser.id, username, email } });
});

// Sign-in Route
app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

// Task routes (protected)
app.get('/api/tasks', authenticateToken, (req, res) => {
  const userTasks = tasks.filter(t => t.userId === req.user.id);
  res.json(userTasks);
});

app.post('/api/tasks', authenticateToken, (req, res) => {
  const { title, due, status } = req.body;
  const newTask = {
    id: Date.now().toString(),
    userId: req.user.id,
    title,
    due,
    status,
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, due, status } = req.body;
  const taskIndex = tasks.findIndex(t => t.id === id && t.userId === req.user.id);
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found or unauthorized' });
  }
  tasks[taskIndex] = { ...tasks[taskIndex], title, due, status };
  res.json(tasks[taskIndex]);
});

app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const initialLength = tasks.length;
  tasks = tasks.filter(t => t.id !== id || t.userId !== req.user.id);
  if (tasks.length === initialLength) {
    return res.status(404).json({ message: 'Task not found or unauthorized' });
  }
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});