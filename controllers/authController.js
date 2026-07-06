const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');
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

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = usersDB.find(u => u.email === email);

  // Always respond the same way whether or not the user exists —
  // this prevents attackers from using this endpoint to discover registered emails
  if (!user) {
    return res.status(200).json({ message: 'If an account exists with this email, a reset link has been sent.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

  const resetUrl = `${process.env.FRONTEND_URL}/?page=reset-password&token=${resetToken}`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Portfolio <onboarding@resend.dev>',
      to: user.email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #f97316;">Password Reset Request</h2>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block; background:#f97316; color:white; padding:10px 20px; border-radius:8px; text-decoration:none; margin-top:10px;">Reset Password</a>
          <p style="color:#888; margin-top:20px; font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    });

    res.status(200).json({ message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (error) {
    console.error('Reset email error:', error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    res.status(500).json({ message: 'Error sending reset email. Please try again later.' });
  }
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = usersDB.find(u =>
    u.resetPasswordToken === hashedToken &&
    u.resetPasswordExpires > Date.now()
  );

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  res.status(200).json({ message: 'Password reset successful. You can now log in.' });
};

module.exports = { signup, login, forgotPassword, resetPassword };