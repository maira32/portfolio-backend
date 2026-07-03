// server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors()); // Allows your React frontend to connect
app.use(express.json()); // Allows the server to read JSON data from React

// --- IN-MEMORY DATABASES (For learning purposes) ---
const usersDB = [];
const messagesDB = [];

// A secret key for generating tokens (In a real app, this goes in a .env file)
const JWT_SECRET = 'my_super_secret_key_123';

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. SIGNUP API
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists in our "database"
  const existingUser = usersDB.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists with this email.' });
  }

  // Hash the password securely
  const hashedPassword = await bcrypt.hash(password, 10);

  // Save the user
  const newUser = { id: Date.now(), name, email, password: hashedPassword };
  usersDB.push(newUser);

  console.log('New User Registered:', email);
  res.status(201).json({ message: 'User created successfully!' });
});

// 2. LOGIN API
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // Find the user in the database
  const user = usersDB.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  // Compare the password sent from React with the hashed password in DB
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  // If successful, create a JWT Token
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

  console.log('User Logged In:', email);
  // Send the token back to React!
  res.status(200).json({ 
    message: 'Login successful', 
    token: token,
    user: { name: user.name, email: user.email }
  });
});

// 3. CONTACT FORM API
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;

  // Save the message to our "database"
  messagesDB.push({ id: Date.now(), name, email, message });
  
  console.log(`New Message from ${name} (${email}): ${message}`);
  res.status(200).json({ message: 'Message received successfully!' });
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});