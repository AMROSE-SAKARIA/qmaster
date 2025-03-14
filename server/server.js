require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const Note = require('./models/Note');
const Submission = require('./models/Submission');
const User = require('./models/User');
const { generateMCQs, generateDescriptiveQuestions } = require('./ai/mcqGenerator');
const path = require('path');
const fs = require('fs');

const app = express();

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  optionsSuccessStatus: 200
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/qmaster', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDFs are allowed'), false);
  },
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const otps = new Map();

const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

const questionSchema = new mongoose.Schema({
  token: String,
  type: String,
  question: String,
  options: [String],
  correctAnswer: String,
  marks: Number,
  pdfContent: String,
});
const Question = mongoose.model('Question', questionSchema);

app.post('/setup-user', async (req, res) => {
  try {
    const { username, password, role } = req.body || { username: 'teacher1', password: 'password123', role: 'teacher' };
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Username taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role });
    await user.save();
    console.log(`User ${username} created successfully`);
    res.json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Server error creating user', details: err.message });
  }
});

app.post('/register', async (req, res) => {
  const { username, password, role, email } = req.body;
  const existingUser = await User.findOne({ username });
  if (existingUser) return res.status(400).json({ error: 'Username taken' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otps.set(username, otp);
  console.log(`Generated OTP for ${username}: ${otp}`);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'QMaster Signup OTP',
    text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      console.error('Email error:', error);
      res.json({ message: `OTP is ${otp} (email failed, using hardcoded for testing)` });
    } else {
      console.log('Email sent');
      res.json({ message: 'OTP sent to email' });
    }
  });
});

app.post('/verify-otp', async (req, res) => {
  const { username, password, role, otp } = req.body;
  if (otps.get(username) !== otp) return res.status(400).json({ error: 'Invalid OTP' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword, role });
  await user.save();
  otps.delete(username);
  res.json({ message: 'User registered' });
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt for:', username, password);
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'default-secret', { expiresIn: '1h' });
    console.log('Login successful for:', username, 'Role:', user.role);
    res.json({ token, role: user.role });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login', details: err.message });
  }
});

app.post('/upload-content', authenticate, upload.single('pdf'), async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Unauthorized' });

  const { textContent, numMCQs, numDescriptive, mcqMarks, descriptiveMarks } = req.body;
  console.log('Upload request:', { textContent: textContent?.substring(0, 100), numMCQs, numDescriptive, file: req.file?.filename });

  if (!textContent && !req.file) return res.status(400).json({ error: 'Provide text for MCQs or a PDF for descriptive questions' });

  const token = uuidv4();
  let pdfContent = '';

  if (req.file) {
    try {
      const pdfBuffer = fs.readFileSync(req.file.path);
      const data = await pdfParse(pdfBuffer);
      pdfContent = data.text;
      console.log('PDF parsed, length:', pdfContent.length);
    } catch (error) {
      console.error('PDF parsing error:', error);
      return res.status(500).json({ error: 'Failed to parse PDF' });
    }
  }

  let mcqs = [];
  if (textContent && textContent.length <= 3000 * 5) { // Approx 3000 words
    try {
      console.log('Generating MCQs from text...');
      mcqs = await generateMCQs(textContent, parseInt(numMCQs) || 5);
      console.log('Generated MCQs:', mcqs);
      for (const mcq of mcqs) {
        const question = new Question({
          token,
          type: 'mcq',
          question: mcq.question,
          options: mcq.options,
          correctAnswer: mcq.correct,
          marks: parseInt(mcqMarks) || 2,
        });
        await question.save();
      }
    } catch (error) {
      console.error('MCQ generation error:', error);
      return res.status(500).json({ error: 'Failed to generate MCQs' });
    }
  } else if (textContent) {
    return res.status(400).json({ error: 'Text exceeds 3000 words limit' });
  }

  let descriptiveQuestions = [];
  if (pdfContent) {
    try {
      console.log('Generating descriptive questions from PDF...');
      descriptiveQuestions = await generateDescriptiveQuestions(pdfContent, parseInt(numDescriptive) || 3);
      console.log('Generated descriptive:', descriptiveQuestions);
      for (const desc of descriptiveQuestions) {
        const question = new Question({
          token,
          type: 'descriptive',
          question: desc.question,
          correctAnswer: desc.answer,
          marks: parseInt(descriptiveMarks) || 10,
          pdfContent,
        });
        await question.save();
      }
    } catch (error) {
      console.error('Descriptive generation error:', error);
      return res.status(500).json({ error: 'Failed to generate descriptive questions' });
    }
  }

  const note = new Note({ token, content: textContent || pdfContent, filePath: req.file?.path });
  await note.save();

  res.json({ token, mcqs, descriptiveQuestions });
});

app.post('/teacher/create-test', authenticate, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Unauthorized' });
  const { token, selectedMCQs, selectedDescriptive } = req.body;
  if (!selectedMCQs?.length || !selectedDescriptive?.length) return res.status(400).json({ error: 'Select questions' });
  res.json({ testToken: token });
});

app.post('/student/join', async (req, res) => {
  const { token } = req.body;
  const mcqs = await Question.find({ token, type: 'mcq' }).limit(5).sort({ $random: 1 });
  const descriptive = await Question.find({ token, type: 'descriptive' }).limit(10).sort({ $random: 1 });
  if (!mcqs.length && !descriptive.length) return res.status(404).json({ error: 'Invalid token' });
  res.json({ mcqs, descriptive, token });
});

app.post('/student/submit', authenticate, async (req, res) => {
  const { token, answers, studentName } = req.body;
  let totalScore = 0;
  let totalMarks = 0;

  const mcqAnswers = answers.mcq || [];
  for (const answer of mcqAnswers) {
    const question = await Question.findById(answer.id);
    if (question && question.correctAnswer === answer.answer) totalScore += question.marks || 0;
    totalMarks += question?.marks || 0;
  }

  const descriptiveAnswers = answers.descriptive || [];
  for (const answer of descriptiveAnswers) {
    const question = await Question.findById(answer.id);
    if (question) {
      const similarity = await evaluateDescriptiveAnswer(answer.answer, question.correctAnswer, question.pdfContent);
      const score = similarity * question.marks || 0;
      totalScore += score;
      totalMarks += question.marks || 0;
    }
  }

  const submission = new Submission({
    token,
    studentName,
    answers,
    score: totalScore,
    totalMarks,
  });
  await submission.save();

  res.json({ score: totalScore, total: totalMarks });
});

async function evaluateDescriptiveAnswer(studentAnswer, correctAnswer, pdfContent) {
  // Placeholder: Use cosine similarity or T5-based scoring (simplified)
  const similarity = 0.8; // Replace with actual NLP similarity (e.g., using Flan-T5)
  return similarity;
}

app.get('/teacher/results', authenticate, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Unauthorized' });
  const submissions = await Submission.find();
  const classAverage = submissions.length ? submissions.reduce((sum, sub) => sum + sub.score, 0) / submissions.length : 0;
  res.json({ submissions, classAverage });
});

app.get('/student/results', authenticate, async (req, res) => {
  const submissions = await Submission.find({ studentName: req.user.username });
  res.json(submissions);
});

app.get('/leaderboard/:token', async (req, res) => {
  const { token } = req.params;
  const submissions = await Submission.find({ token }).sort({ score: -1 });
  const totalQuestions = await Question.countDocuments({ token });
  const classAverage = submissions.length ? submissions.reduce((sum, sub) => sum + sub.score, 0) / submissions.length : 0;
  res.json({ submissions, classAverage, totalQuestions });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));