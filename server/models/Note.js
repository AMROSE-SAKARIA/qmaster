const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  token: String,
  content: String,
  filePath: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Note', noteSchema);