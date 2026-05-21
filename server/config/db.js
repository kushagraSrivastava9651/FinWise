const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGO_URI (or MONGODB_URI) in environment');
  }

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
}

module.exports = connectDB;
