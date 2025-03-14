import { useState, useEffect } from 'react';
import axios from 'axios';

function TeacherDashboard({ token, setToken }) {
  const [textContent, setTextContent] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [numMCQs, setNumMCQs] = useState(5);
  const [numDescriptive, setNumDescriptive] = useState(3);
  const [mcqMarks, setMcqMarks] = useState(2);
  const [descriptiveMarks, setDescriptiveMarks] = useState(10);
  const [message, setMessage] = useState('');
  const [tokenResult, setTokenResult] = useState('');
  const [questions, setQuestions] = useState({ mcqs: [], descriptive: [] });
  const [selectedMCQs, setSelectedMCQs] = useState([]);
  const [selectedDescriptive, setSelectedDescriptive] = useState([]);
  const [results, setResults] = useState({ submissions: [], classAverage: 0 });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!textContent && !pdfFile) {
      setMessage('Please provide text for MCQs or a PDF for descriptive questions');
      return;
    }
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    formData.append('textContent', textContent);
    formData.append('numMCQs', numMCQs);
    formData.append('numDescriptive', numDescriptive);
    formData.append('mcqMarks', mcqMarks);
    formData.append('descriptiveMarks', descriptiveMarks);

    try {
      const res = await axios.post('http://localhost:5000/upload-content', formData, {
        headers: { 'authorization': token, 'Content-Type': 'multipart/form-data' },
      });
      setMessage(`Questions generated with token: ${res.data.token}`);
      setTokenResult(res.data.token);
      setQuestions({ mcqs: res.data.mcqs || [], descriptive: res.data.descriptiveQuestions || [] });
    } catch (error) {
      setMessage(`Upload failed: ${error.response?.data?.error || error.message || 'Network Error'}`);
    }
  };

  const fetchQuestions = async () => {
    if (!tokenResult) return;
    try {
      const res = await axios.get(`http://localhost:5000/teacher/questions/${tokenResult}`, {
        headers: { 'authorization': token },
      });
      setQuestions(res.data);
    } catch (error) {
      setMessage(`Failed to fetch questions: ${error.response?.data?.error || error.message || 'Network Error'}`);
    }
  };

  const handleSelectMCQ = (id) => {
    setSelectedMCQs(prev => (prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 5 ? [...prev, id] : prev));
  };

  const handleSelectDescriptive = (id) => {
    setSelectedDescriptive(prev => (prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 10 ? [...prev, id] : prev));
  };

  const handleCreateTest = async () => {
    if (selectedMCQs.length !== 5 || selectedDescriptive.length !== 10) {
      setMessage('Select exactly 5 MCQs and 10 descriptive questions');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/teacher/create-test', {
        token: tokenResult,
        selectedMCQs: selectedMCQs.map(id => ({ id })),
        selectedDescriptive: selectedDescriptive.map(id => ({ id })),
      }, { headers: { 'authorization': token } });
      setMessage(`Test created with token: ${res.data.testToken}`);
    } catch (error) {
      setMessage(`Test creation failed: ${error.response?.data?.error || error.message || 'Network Error'}`);
    }
  };

  const fetchResults = async () => {
    try {
      const res = await axios.get('http://localhost:5000/teacher/results', { headers: { 'authorization': token } });
      setResults(res.data);
    } catch (error) {
      setMessage(`Failed to fetch results: ${error.response?.data?.error || error.message || 'Network Error'}`);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchResults();
  }, [tokenResult]);

  return (
    <div className="container">
      <h2 className="text-2xl font-bold mb-4 text-blue-600">Teacher Dashboard</h2>
      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h3 className="text-xl font-semibold mb-4">Generate Questions</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <textarea
            placeholder="Enter text for MCQs (max 3000 words)"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            maxLength={15000}
            className="border p-2 w-full h-40 rounded"
          />
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files[0])}
            className="border p-2 w-full"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              value={numMCQs}
              onChange={(e) => setNumMCQs(Math.min(100, e.target.value))}
              placeholder="Number of MCQs"
              className="border p-2 rounded"
              min="1"
            />
            <input
              type="number"
              value={numDescriptive}
              onChange={(e) => setNumDescriptive(Math.min(100, e.target.value))}
              placeholder="Number of Descriptive"
              className="border p-2 rounded"
              min="1"
            />
            <input
              type="number"
              value={mcqMarks}
              onChange={(e) => setMcqMarks(e.target.value)}
              placeholder="MCQ Marks"
              className="border p-2 rounded"
              min="1"
            />
            <input
              type="number"
              value={descriptiveMarks}
              onChange={(e) => setDescriptiveMarks(e.target.value)}
              placeholder="Descriptive Marks"
              className="border p-2 rounded"
              min="1"
            />
          </div>
          <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full hover:bg-blue-600">
            Upload & Generate Questions
          </button>
        </form>
        {message && <p className={message.includes('failed') ? 'text-red-500' : 'text-green-500'}>{message}</p>}
      </div>

      {tokenResult && (
        <div className="bg-white p-6 rounded shadow-md mb-6">
          <h3 className="text-xl font-semibold mb-4">Select Questions for Test</h3>
          <div className="mb-4">
            <h4 className="font-medium">MCQs (Select 5)</h4>
            {questions.mcqs.map((q) => (
              <div key={q._id} className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  checked={selectedMCQs.includes(q._id)}
                  onChange={() => handleSelectMCQ(q._id)}
                  disabled={selectedMCQs.length >= 5 && !selectedMCQs.includes(q._id)}
                />
                <p>{q.question}</p>
              </div>
            ))}
          </div>
          <div className="mb-4">
            <h4 className="font-medium">Descriptive Questions (Select 10)</h4>
            {questions.descriptive.map((q) => (
              <div key={q._id} className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  checked={selectedDescriptive.includes(q._id)}
                  onChange={() => handleSelectDescriptive(q._id)}
                  disabled={selectedDescriptive.length >= 10 && !selectedDescriptive.includes(q._id)}
                />
                <p>{q.question}</p>
              </div>
            ))}
          </div>
          <button
            onClick={handleCreateTest}
            className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
            disabled={selectedMCQs.length !== 5 || selectedDescriptive.length !== 10}
          >
            Create Test
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded shadow-md">
        <h3 className="text-xl font-semibold mb-4">Results</h3>
        <p>Average Score: {results.classAverage.toFixed(2)}</p>
        <ul>
          {results.submissions.map((sub) => (
            <li key={sub._id} className="mb-2">
              {sub.studentName}: {sub.score}/{sub.totalMarks}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default TeacherDashboard;