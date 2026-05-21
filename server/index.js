const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use('/api/auth', authRoutes);

// Serve static files from the built frontend
const path = require('path');
app.use(express.static(path.join(__dirname, '../dist')));

// API routes
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', service: 'FinWise Auth Server' });
});

// Serve frontend for all other routes (for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});
