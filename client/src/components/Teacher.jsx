import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUpload, FaQuestionCircle, FaEye, FaCheckSquare, FaTrophy, FaUser, FaWhatsapp, FaEnvelope, FaTimes, FaHistory } from 'react-icons/fa';

function Teacher({ token, role, setTokenId }) {
  const [inputType, setInputType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [numMCQs, setNumMCQs] = useState(5);
  const [numDescriptive, setNumDescriptive] = useState(3);
  const [mcqMarks, setMcqMarks] = useState(2);
  const [descriptiveMarks, setDescriptiveMarks] = useState(10);
  const [desiredMCQs, setDesiredMCQs] = useState(5);
  const [desiredDescriptive, setDesiredDescriptive] = useState(3);
  const [tokenId, setLocalTokenId] = useState('');
  const [questions, setQuestions] = useState({ mcqs: [], descriptive: [], totalMCQs: 0, totalDescriptive: 0, subject: 'General' });
  const [message, setMessage] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');
  const [subject, setSubject] = useState('General'); // New: Subject state
  const [questionHistory, setQuestionHistory] = useState([]); // New: Question history state
  const navigate = useNavigate();

  // Redirect if not a teacher
  useEffect(() => {
    if (role !== 'teacher') {
      navigate('/');
    }
  }, [role, navigate]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('inputType', inputType);
    formData.append('subject', subject); // Add subject to form data

    if (inputType === 'text') {
      if (!textContent.trim()) {
        setMessage('Please provide text content');
        return;
      }
      formData.append('textContent', textContent);
    } else if (inputType === 'pdf') {
      if (!pdfFile) {
        setMessage('Please upload a PDF file');
        return;
      }
      formData.append('pdf', pdfFile);
    }

    formData.append('numMCQs', numMCQs);
    formData.append('numDescriptive', numDescriptive);
    formData.append('mcqMarks', mcqMarks);
    formData.append('descriptiveMarks', descriptiveMarks);

    try {
      const res = await axios.post('http://localhost:5000/api/upload-content', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'multipart/form-data' 
        },
      });
      const newTokenId = res.data.token;
      setLocalTokenId(newTokenId);
      setTokenId(newTokenId); // Pass token to parent component
      setGeneratedToken(newTokenId);
      setShowTokenModal(true);
      setMessage('Content uploaded successfully');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Upload failed');
    }
  };

  const fetchQuestions = async () => {
    if (!tokenId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/teacher/questions/${tokenId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const { mcqs, descriptive, totalMCQs, totalDescriptive, subject: fetchedSubject } = res.data;
      setQuestions({ mcqs, descriptive, totalMCQs, totalDescriptive, subject: fetchedSubject || 'General' });

      if (totalMCQs < desiredMCQs) {
        setMessage(`Warning: Only ${totalMCQs} valid MCQs available, but ${desiredMCQs} requested.`);
        setDesiredMCQs(totalMCQs);
      }
      if (totalDescriptive < desiredDescriptive) {
        setMessage(prev => prev ? `${prev} | Only ${totalDescriptive} valid Descriptive questions available, but ${desiredDescriptive} requested.` : `Only ${totalDescriptive} valid Descriptive questions available, but ${desiredDescriptive} requested.`);
        setDesiredDescriptive(totalDescriptive);
      } else {
        setMessage('Questions fetched successfully');
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to fetch questions');
    }
  };

  const fetchQuestionHistory = async () => {
    if (!tokenId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/teacher/question-history/${tokenId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setQuestionHistory(res.data.history);
      setMessage('Question history fetched successfully');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to fetch question history');
    }
  };

  const handleCreateTest = async () => {
    if (desiredMCQs < 1 || desiredDescriptive < 1) {
      setMessage('Desired MCQs and Descriptive questions must be at least 1.');
      return;
    }
    if (desiredMCQs > questions.totalMCQs) {
      setMessage(`Cannot create test: Only ${questions.totalMCQs} valid MCQs available, but ${desiredMCQs} requested.`);
      return;
    }
    if (desiredDescriptive > questions.totalDescriptive) {
      setMessage(`Cannot create test: Only ${questions.totalDescriptive} valid Descriptive questions available, but ${desiredDescriptive} requested.`);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/teacher/create-test', {
        token: tokenId,
        desiredMCQs,
        desiredDescriptive,
      }, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setMessage(`Test created! Token: ${res.data.testToken}`);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to create test');
    }
  };

  const handleViewResults = () => {
    navigate(`/leaderboard/${tokenId}`);
  };

  // Format options with letters (a, b, c, d)
  const formatOptions = (options) => {
    return options.map((opt, index) => `${String.fromCharCode(97 + index)}. ${opt}`).join('<br />');
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="text-center">Teacher Dashboard</h2>
        <h3>Upload Content</h3>
        <form onSubmit={handleUpload}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject (e.g., Math, Science)"
              className="w-full"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Select Input Type:</label>
            <select
              value={inputType}
              onChange={(e) => {
                setInputType(e.target.value);
                setTextContent('');
                setPdfFile(null);
              }}
              className="w-full"
            >
              <option value="text">Text</option>
              <option value="pdf">PDF</option>
            </select>
          </div>

          {inputType === 'text' ? (
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Text Content</label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste text for question generation (up to 3000 words)"
                className="w-full"
                rows="5"
              />
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Upload PDF</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files[0])}
                className="w-full"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Number of MCQs to Generate</label>
            <input
              type="number"
              value={numMCQs}
              onChange={(e) => setNumMCQs(e.target.value)}
              placeholder="Number of MCQs"
              className="w-full"
              min="1"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Number of Descriptive Questions to Generate</label>
            <input
              type="number"
              value={numDescriptive}
              onChange={(e) => setNumDescriptive(e.target.value)}
              placeholder="Number of Descriptive Questions"
              className="w-full"
              min="1"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Marks per MCQ</label>
            <input
              type="number"
              value={mcqMarks}
              onChange={(e) => setMcqMarks(e.target.value)}
              placeholder="Marks per MCQ"
              className="w-full"
              min="1"
              step="0.5"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Marks per Descriptive</label>
            <input
              type="number"
              value={descriptiveMarks}
              onChange={(e) => setDescriptiveMarks(e.target.value)}
              placeholder="Marks per Descriptive"
              className="w-full"
              min="1"
              step="0.5"
            />
          </div>
          <div className="flex justify-center">
            <button type="submit" className="bg-blue-500 flex items-center space-x-2">
              <FaUpload />
              <span>Upload</span>
            </button>
          </div>
        </form>

        {tokenId && (
          <>
            <h3 className="mt-4">Token: {tokenId} | Subject: {questions.subject}</h3>
            <div className="flex justify-center space-x-4">
              <button onClick={fetchQuestions} className="bg-green-500 flex items-center space-x-2 mt-2">
                <FaQuestionCircle />
                <span>Fetch Question Pool</span>
              </button>
              <button onClick={fetchQuestionHistory} className="bg-yellow-500 flex items-center space-x-2 mt-2">
                <FaHistory />
                <span>View Question History</span>
              </button>
            </div>
            {questions.totalMCQs > 0 && (
              <>
                <h4 className="mt-4">MCQs in Question Pool (Available: {questions.totalMCQs})</h4>
                {questions.mcqs.map((q, index) => (
                  <div key={q._id} className="mb-2">
                    <div className="flex items-center">
                      <span>{index + 1}. {q.question}</span>
                      <button
                        onClick={() => setSelectedQuestion(q)}
                        className="ml-2 bg-blue-500 text-white p-1 rounded text-sm flex items-center space-x-1"
                      >
                        <FaEye />
                        <span>View Details</span>
                      </button>
                    </div>
                    {selectedQuestion === q && (
                      <div className="ml-6 mt-2 p-2 border rounded" dangerouslySetInnerHTML={{ __html: `
                        <p><strong>Options:</strong></p>
                        <ul>
                          ${formatOptions(q.options).replace(/\n/g, '<br />')}
                        </ul>
                        <p><strong>Correct Answer:</strong> ${q.correctAnswer}</p>
                        <p><strong>Context:</strong> ${q.context}</p>
                        <p><strong>Difficulty:</strong> ${q.difficulty}</p>
                        <button onClick={() => setSelectedQuestion(null)} className="mt-2 bg-gray-500 text-white p-1 rounded flex items-center space-x-1">
                          <FaTimes />
                          <span>Close</span>
                        </button>
                      `}} />
                    )}
                  </div>
                ))}
              </>
            )}
            {questions.totalDescriptive > 0 && (
              <>
                <h4 className="mt-4">Descriptive Questions in Question Pool (Available: {questions.totalDescriptive})</h4>
                {questions.descriptive.map((q, index) => (
                  <div key={q._id} className="mb-2">
                    <div className="flex items-center">
                      <span>{index + 1}. {q.question}</span>
                      <button
                        onClick={() => setSelectedQuestion(q)}
                        className="ml-2 bg-blue-500 text-white p-1 rounded text-sm flex items-center space-x-1"
                      >
                        <FaEye />
                        <span>View Details</span>
                      </button>
                    </div>
                    {selectedQuestion === q && (
                      <div className="ml-6 mt-2 p-2 border rounded">
                        <p><strong>Answer:</strong> {q.correctAnswer}</p>
                        <p><strong>Context:</strong> {q.context}</p>
                        <p><strong>Difficulty:</strong> {q.difficulty}</p>
                        <button
                          onClick={() => setSelectedQuestion(null)}
                          className="mt-2 bg-gray-500 text-white p-1 rounded flex items-center space-x-1"
                        >
                          <FaTimes />
                          <span>Close</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
            {questionHistory.length > 0 && (
              <div className="mt-4">
                <h4>Question History</h4>
                {questionHistory.map((q, index) => (
                  <div key={q._id} className="mb-4 p-2 border rounded">
                    <p><strong>{index + 1}. {q.question}</strong> (Subject: {q.subject}, Difficulty: {q.difficulty})</p>
                    {q.type === 'mcq' && (
                      <div dangerouslySetInnerHTML={{ __html: `
                        <p><strong>Options:</strong></p>
                        <ul>
                          ${formatOptions(q.options).replace(/\n/g, '<br />')}
                        </ul>
                        <p><strong>Correct Answer:</strong> ${q.correctAnswer}</p>
                      `}} />
                    )}
                    {q.type === 'descriptive' && (
                      <p><strong>Correct Answer:</strong> {q.correctAnswer}</p>
                    )}
                    <p><strong>Context:</strong> {q.context}</p>
                    <h5>Student Performance:</h5>
                    {q.studentPerformance.length > 0 ? (
                      q.studentPerformance.map((perf, perfIndex) => (
                        <div key={perfIndex} className="ml-4">
                          <p><strong>Student:</strong> {perf.studentName}</p>
                          <p><strong>Answer:</strong> {perf.answer}</p>
                          {q.type === 'mcq' ? (
                            <p><strong>Correct:</strong> {perf.isCorrect ? 'Yes' : 'No'} (Score: {perf.score}/{q.marks})</p>
                          ) : (
                            <p><strong>Similarity:</strong> {perf.similarity.toFixed(2)} (Score: {perf.score}/{q.marks})</p>
                          )}
                          <p><strong>Submitted At:</strong> {new Date(perf.submittedAt).toLocaleString()}</p>
                        </div>
                      ))
                    ) : (
                      <p>No student submissions yet.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {(questions.totalMCQs > 0 || questions.totalDescriptive > 0) && (
              <>
                <div className="mt-4">
                  <label className="block text-gray-700 mb-1">Desired MCQs for Test:</label>
                  <input
                    type="number"
                    value={desiredMCQs}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value > questions.totalMCQs) {
                        setMessage(`Cannot set desired MCQs to ${value}. Only ${questions.totalMCQs} valid MCQs available.`);
                        setDesiredMCQs(questions.totalMCQs);
                      } else {
                        setDesiredMCQs(value);
                      }
                    }}
                    placeholder="Desired MCQs for Test"
                    className="w-full"
                    min="1"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-gray-700 mb-1">Desired Descriptive Questions for Test:</label>
                  <input
                    type="number"
                    value={desiredDescriptive}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value > questions.totalDescriptive) {
                        setMessage(`Cannot set desired Descriptive questions to ${value}. Only ${questions.totalDescriptive} valid Descriptive questions available.`);
                        setDesiredDescriptive(questions.totalDescriptive);
                      } else {
                        setDesiredDescriptive(value);
                      }
                    }}
                    placeholder="Desired Descriptive for Test"
                    className="w-full"
                    min="1"
                  />
                </div>
                <div className="flex justify-center space-x-4 mt-4">
                  <button onClick={handleCreateTest} className="bg-blue-500 flex items-center space-x-2">
                    <FaCheckSquare />
                    <span>Create Test</span>
                  </button>
                  <button onClick={handleViewResults} className="bg-gray-500 flex items-center space-x-2">
                    <FaTrophy />
                    <span>View Results</span>
                  </button>
                  <button onClick={() => navigate('/profile')} className="bg-purple-500 flex items-center space-x-2">
                    <FaUser />
                    <span>View Profile</span>
                  </button>
                </div>
              </>
            )}
          </>
        )}
        {message && <p className={`text-center mt-4 ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}

        {showTokenModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
              <h3 className="text-lg font-bold mb-2">Upload Successful!</h3>
              <p className="mb-2"><strong>Generated Token:</strong> {generatedToken}</p>
              <p className="mb-4"><strong>Subject:</strong> {subject}</p>
              <div className="flex justify-center space-x-4">
                <a
                  href={`https://api.whatsapp.com/send?text=Here%20is%20my%20QMaster%20token:%20${generatedToken}%20(Subject:%20${subject})`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 text-white p-2 rounded flex items-center space-x-2"
                >
                  <FaWhatsapp />
                  <span>Share via WhatsApp</span>
                </a>
                <a
                  href={`mailto:?subject=QMaster%20Token&body=Here%20is%20my%20QMaster%20token:%20${generatedToken}%20(Subject:%20${subject})`}
                  className="bg-red-500 text-white p-2 rounded flex items-center space-x-2"
                >
                  <FaEnvelope />
                  <span>Share via Gmail</span>
                </a>
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="mt-4 bg-gray-500 text-white p-2 rounded flex items-center space-x-2 mx-auto block"
              >
                <FaTimes />
                <span>Close</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Teacher;