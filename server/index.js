const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const buildPath = path.join(__dirname, '../dist');

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use('/api/auth', authRoutes);

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', service: 'FinWise Auth Server' });
});

app.use(express.static(buildPath));

// SPA fallback: serve index.html for client-side routes (e.g. /login)
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'), (err) => {
    if (err) {
      res.status(500).json({ status: 'error', message: 'Failed to load page' });
    }
  });
});

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
