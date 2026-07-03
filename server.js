require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

const app = express();
app.use(cors());
app.use(express.json());

const usersDB = [];

const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'my_super_secret_key_123';

app.get('/', (req, res) => {
  res.send('Portfolio API is running! Auth and Email routes are active.');
});


app.post('/api/signup', async (req, res) => {
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
});


app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const user = usersDB.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

  console.log('User Logged In:', email);
  res.status(200).json({ 
    message: 'Login successful', 
    token: token,
    user: { name: user.name, email: user.email }
  });
});


app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const { data, error } = await resend.emails.send({
      from: 'Portfolio Contact Form <onboarding@resend.dev>',
      to: 'mairatahir3@gmail.com', 
      subject: `New Portfolio Message from ${name}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #f97316;">New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <br/>
            <p><strong>Message:</strong></p>
            <p style="background-color: #f3f4f6; padding: 15px; border-radius: 8px;">${message}</p>
        </div>
      `
    });

    if (error) {
      console.error('Resend Error:', error);
      return res.status(400).json({ message: 'Failed to send email.' });
    }

    console.log(`Email successfully sent to you from ${name}!`);
    res.status(200).json({ message: 'Message received successfully!' });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = app;