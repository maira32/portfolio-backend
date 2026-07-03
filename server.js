require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Portfolio API is running! (MVC Architecture)');
});

app.use('/api', authRoutes);
app.use('/api', contactRoutes);

module.exports = app;