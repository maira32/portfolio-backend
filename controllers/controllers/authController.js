const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usersDB = require('../models/userModel'); // Import our "database"

const JWT_SECRET = process.env.JWT_SECRET || 'my_super_secret_key_123';

const signup = async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = usersDB.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists with this email.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now(), name, email, password: hashedPassword };
  usersDB.push(newUser);

  console.log('New User Registered:', email);
  res.status(201).json({ message: 'User created successfully!' });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = usersDB.find(u => u.email === email);
  if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return res.status(401).json({ message: 'Invalid email or password.' });

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

  console.log('User Logged In:', email);
  res.status(200).json({ 
    message: 'Login successful', 
    token, 
    user: { name: user.name, email: user.email } 
  });
};

module.exports = { signup, login };