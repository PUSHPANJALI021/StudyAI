const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/predictions', require('./routes/predictions'));

// Base Route
app.get('/', (req, res) => {
  res.send({ status: 'success', message: 'Smart Study Planner API is running' });
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
    console.log('Falling back to local express execution without DB connection. Server running for layout verification...');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (Database Offline)`);
    });
  });
