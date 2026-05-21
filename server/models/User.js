const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ALPHANUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function formatNamePrefix(name) {
  const cleaned = String(name || 'user')
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();

  return cleaned.slice(0, 4).padEnd(4, 'X');
}

function randomCode(length = 4) {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (byte) => ALPHANUMERIC[byte % ALPHANUMERIC.length]).join('');
}

async function generateUniqueUserId(name) {
  const prefix = formatNamePrefix(name);
  const UserModel = mongoose.models.User || mongoose.model('User');

  let userId;
  let exists = true;
  while (exists) {
    userId = `${prefix}-${randomCode(4)}`;
    exists = await UserModel.exists({ userId });
  }

  return userId;
}

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

userSchema.statics.generateUniqueUserId = async function (name) {
  const prefix = formatNamePrefix(name);
  let userId;
  let exists = true;

  while (exists) {
    userId = `${prefix}-${randomCode(4)}`;
    exists = await this.exists({ userId });
  }

  return userId;
};

userSchema.pre('save', async function (next) {
  if (!this.userId) {
    this.userId = await this.constructor.generateUniqueUserId(this.name);
  }

  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
