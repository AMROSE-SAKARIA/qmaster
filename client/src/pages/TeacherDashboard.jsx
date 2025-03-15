import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function TeacherDashboard({ token, role }) {
  const [inputType, setInputType] = useState('text'); // New state for input type
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
  const navigate = useNavigate();

  // Redirect if not a teacher
  if (role !== 'teacher') {
    navigate('/');
    return null;
  }

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('inputType', inputType); // Add inputType to form data

    // Append the appropriate content based on inputType
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

      // Pre-select questions based on desired numbers
      setSelectedMCQs(mcqs.slice(0, Math.min(desiredMCQs, mcqs.length)).map(q => q._id));
      setSelectedDescriptive(descriptive.slice(0, Math.min(desiredDescriptive, descriptive.length)).map(q => q._id));

      // Warn if there aren't enough questions
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
    // Validate the number of selected questions
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
            {/* Input Type Selection */}
            <div className="mb-4">
              <label className="block text-gray-700">Select Input Type:</label>
              <select
                value={inputType}
                onChange={(e) => {
                  setInputType(e.target.value);
                  // Reset fields when switching input type
                  setTextContent('');
                  setPdfFile(null);
                }}
                className="mt-1 p-2 border rounded w-full"
              >
                <option value="text">Text</option>
                <option value="pdf">PDF</option>
              </select>
            </div>

            {/* Conditional Input Fields */}
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
                    <div key={q._id} className="flex items-center mb-2">
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
                    </div>
                  ))}
                </>
              )}
              {questions.descriptive.length > 0 && (
                <>
                  <h4 className="mt-4">Descriptive Questions (Available: {questions.descriptive.length})</h4>
                  {questions.descriptive.map((q, index) => (
                    <div key={q._id} className="flex items-center mb-2">
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
            </>
          )}
          {message && <p className={message.includes('success') ? 'text-green-500' : 'text-red-500'}>{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;