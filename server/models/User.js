const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  password: String, // Hashed
  role: { type: String, enum: ['teacher', 'student'], default: 'student' },
});

module.exports = mongoose.model('User', userSchema);