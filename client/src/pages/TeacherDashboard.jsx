import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function TeacherDashboard({ token, role }) {
  const [inputType, setInputType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [numMCQs, setNumMCQs] = useState(5);
  const [numDescriptive, setNumDescriptive] = useState(3);
  const [mcqMarks, setMcqMarks] = useState(2);
  const [descriptiveMarks, setDescriptiveMarks] = useState(10);
  const [desiredMCQs, setDesiredMCQs] = useState(5);
  const [desiredDescriptive, setDesiredDescriptive] = useState(3);
  const [tokenId, setTokenId] = useState('');
  const [questions, setQuestions] = useState({ mcqs: [], descriptive: [] });
  const [selectedMCQs, setSelectedMCQs] = useState([]);
  const [selectedDescriptive, setSelectedDescriptive] = useState([]);
  const [message, setMessage] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null); // New state for viewing question details
  const [showTokenModal, setShowTokenModal] = useState(false); // For token pop-up
  const [generatedToken, setGeneratedToken] = useState(''); // For token pop-up
  const navigate = useNavigate();

  // Redirect if not a teacher
  if (role !== 'teacher') {
    navigate('/');
    return null;
  }

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('inputType', inputType);

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
      setTokenId(res.data.token);
      setGeneratedToken(res.data.token); // Store the token for the modal
      setShowTokenModal(true); // Show the token pop-up
      setMessage('Content uploaded successfully');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Upload failed');
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/teacher/questions/${tokenId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const { mcqs, descriptive } = res.data;
      setQuestions({ mcqs, descriptive });

      setSelectedMCQs(mcqs.slice(0, Math.min(desiredMCQs, mcqs.length)).map(q => q._id));
      setSelectedDescriptive(descriptive.slice(0, Math.min(desiredDescriptive, descriptive.length)).map(q => q._id));

      if (mcqs.length < desiredMCQs) {
        setMessage(`Warning: Only ${mcqs.length} MCQs available, but ${desiredMCQs} requested.`);
      }
      if (descriptive.length < desiredDescriptive) {
        setMessage(prev => prev ? `${prev} | Only ${descriptive.length} Descriptive questions available, but ${desiredDescriptive} requested.` : `Only ${descriptive.length} Descriptive questions available, but ${desiredDescriptive} requested.`);
      } else {
        setMessage('Questions fetched successfully');
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to fetch questions');
    }
  };

  const handleCreateTest = async () => {
    if (selectedMCQs.length !== desiredMCQs) {
      setMessage(`Please select exactly ${desiredMCQs} MCQs. Currently selected: ${selectedMCQs.length}`);
      return;
    }
    if (selectedDescriptive.length !== desiredDescriptive) {
      setMessage(`Please select exactly ${desiredDescriptive} Descriptive questions. Currently selected: ${selectedDescriptive.length}`);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/teacher/create-test', {
        token: tokenId,
        selectedMCQs: selectedMCQs.map(id => ({ id })),
        selectedDescriptive: selectedDescriptive.map(id => ({ id })),
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

  return (
    <div className="app">
      <div className="container">
        <div className="card">
          <h2>Teacher Dashboard</h2>
          <h3>Upload Content</h3>
          <form onSubmit={handleUpload}>
            <div className="mb-4">
              <label className="block text-gray-700">Select Input Type:</label>
              <select
                value={inputType}
                onChange={(e) => {
                  setInputType(e.target.value);
                  setTextContent('');
                  setPdfFile(null);
                }}
                className="mt-1 p-2 border rounded w-full"
              >
                <option value="text">Text</option>
                <option value="pdf">PDF</option>
              </select>
            </div>

            {inputType === 'text' ? (
              <div className="mb-4">
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste text for question generation (up to 3000 words)"
                  className="w-full p-2 border rounded"
                  rows="5"
                />
              </div>
            ) : (
              <div className="mb-4">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  className="w-full p-2 border rounded"
                />
              </div>
            )}

            <div className="mb-4">
              <input
                type="number"
                value={numMCQs}
                onChange={(e) => setNumMCQs(e.target.value)}
                placeholder="Number of MCQs"
                className="w-full p-2 border rounded"
                min="1"
              />
            </div>
            <div className="mb-4">
              <input
                type="number"
                value={numDescriptive}
                onChange={(e) => setNumDescriptive(e.target.value)}
                placeholder="Number of Descriptive Questions"
                className="w-full p-2 border rounded"
                min="1"
              />
            </div>
            <div className="mb-4">
              <input
                type="number"
                value={mcqMarks}
                onChange={(e) => setMcqMarks(e.target.value)}
                placeholder="Marks per MCQ"
                className="w-full p-2 border rounded"
                min="1"
                step="0.5"
              />
            </div>
            <div className="mb-4">
              <input
                type="number"
                value={descriptiveMarks}
                onChange={(e) => setDescriptiveMarks(e.target.value)}
                placeholder="Marks per Descriptive"
                className="w-full p-2 border rounded"
                min="1"
                step="0.5"
              />
            </div>
            <button type="submit" className="bg-blue-500 text-white p-2 rounded">
              Upload
            </button>
          </form>

          {tokenId && (
            <>
              <h3 className="mt-4">Token: {tokenId}</h3>
              <button onClick={fetchQuestions} className="bg-green-500 text-white p-2 rounded mt-2">
                Fetch Questions
              </button>
              {questions.mcqs.length > 0 && (
                <>
                  <h4 className="mt-4">MCQs (Available: {questions.mcqs.length})</h4>
                  {questions.mcqs.map((q, index) => (
                    <div key={q._id} className="mb-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedMCQs.includes(q._id)}
                          onChange={() => {
                            setSelectedMCQs(prev => {
                              if (prev.includes(q._id)) {
                                return prev.filter(id => id !== q._id);
                              } else if (prev.length < desiredMCQs) {
                                return [...prev, q._id];
                              }
                              return prev;
                            });
                          }}
                          className="mr-2"
                        />
                        <span>{index + 1}. {q.question}</span>
                        <button
                          onClick={() => setSelectedQuestion(q)}
                          className="ml-2 bg-blue-500 text-white p-1 rounded text-sm"
                        >
                          View Details
                        </button>
                      </div>
                      {selectedQuestion === q && (
                        <div className="ml-6 mt-2 p-2 border rounded">
                          <p><strong>Options:</strong></p>
                          <ul>
                            {q.options.map((opt, i) => (
                              <li key={i} className={q.correctAnswer === opt ? 'text-green-500' : ''}>
                                {i + 1}. {opt} {q.correctAnswer === opt && '(Correct)'}
                              </li>
                            ))}
                          </ul>
                          <p><strong>Context:</strong> {q.context}</p>
                          <p><strong>Difficulty:</strong> {q.difficulty}</p>
                          <button
                            onClick={() => setSelectedQuestion(null)}
                            className="mt-2 bg-gray-500 text-white p-1 rounded"
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
              {questions.descriptive.length > 0 && (
                <>
                  <h4 className="mt-4">Descriptive Questions (Available: {questions.descriptive.length})</h4>
                  {questions.descriptive.map((q, index) => (
                    <div key={q._id} className="mb-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedDescriptive.includes(q._id)}
                          onChange={() => {
                            setSelectedDescriptive(prev => {
                              if (prev.includes(q._id)) {
                                return prev.filter(id => id !== q._id);
                              } else if (prev.length < desiredDescriptive) {
                                return [...prev, q._id];
                              }
                              return prev;
                            });
                          }}
                          className="mr-2"
                        />
                        <span>{index + 1}. {q.question}</span>
                        <button
                          onClick={() => setSelectedQuestion(q)}
                          className="ml-2 bg-blue-500 text-white p-1 rounded text-sm"
                        >
                          View Details
                        </button>
                      </div>
                      {selectedQuestion === q && (
                        <div className="ml-6 mt-2 p-2 border rounded">
                          <p><strong>Answer:</strong> {q.correctAnswer}</p>
                          <p><strong>Context:</strong> {q.context}</p>
                          <p><strong>Difficulty:</strong> {q.difficulty}</p>
                          <button
                            onClick={() => setSelectedQuestion(null)}
                            className="mt-2 bg-gray-500 text-white p-1 rounded"
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
              <div className="mt-4">
                <label className="block text-gray-700">Desired MCQs for Test: </label>
                <input
                  type="number"
                  value={desiredMCQs}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setDesiredMCQs(value);
                    setSelectedMCQs(questions.mcqs.slice(0, Math.min(value, questions.mcqs.length)).map(q => q._id));
                  }}
                  placeholder="Desired MCQs for Test"
                  className="w-full p-2 border rounded"
                  min="1"
                />
              </div>
              <div className="mt-4">
                <label className="block text-gray-700">Desired Descriptive for Test: </label>
                <input
                  type="number"
                  value={desiredDescriptive}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setDesiredDescriptive(value);
                    setSelectedDescriptive(questions.descriptive.slice(0, Math.min(value, questions.descriptive.length)).map(q => q._id));
                  }}
                  placeholder="Desired Descriptive for Test"
                  className="w-full p-2 border rounded"
                  min="1"
                />
              </div>
              <button onClick={handleCreateTest} className="bg-blue-500 text-white p-2 rounded mt-4">
                Create Test
              </button>
              <button onClick={handleViewResults} className="bg-gray-500 text-white p-2 rounded mt-4 ml-2">
                View Results
              </button>
              <button onClick={() => navigate('/profile')} className="bg-purple-500 text-white p-2 rounded mt-4 ml-2">
                View Profile
              </button>
            </>
          )}
          {message && <p className={message.includes('success') ? 'text-green-500' : 'text-red-500'}>{message}</p>}

          {/* Token Pop-Up Modal */}
          {showTokenModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-4 rounded shadow-lg">
                <h3 className="text-lg font-bold">Upload Successful!</h3>
                <p><strong>Generated Token:</strong> {generatedToken}</p>
                <div className="mt-2">
                  <a
                    href={`https://api.whatsapp.com/send?text=Here%20is%20my%20QMaster%20token:%20${generatedToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 text-white p-2 rounded mr-2"
                  >
                    Share via WhatsApp
                  </a>
                  <a
                    href={`mailto:?subject=QMaster%20Token&body=Here%20is%20my%20QMaster%20token:%20${generatedToken}`}
                    className="bg-red-500 text-white p-2 rounded"
                  >
                    Share via Gmail
                  </a>
                </div>
                <button
                  onClick={() => setShowTokenModal(false)}
                  className="mt-4 bg-gray-500 text-white p-2 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;