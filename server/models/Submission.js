const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  token: String,
  studentName: String,
  answers: Object, // { questionId: selectedOption }
  score: Number,
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Submission', submissionSchema);