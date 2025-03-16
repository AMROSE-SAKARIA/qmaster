import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { FaEye, FaCheckSquare, FaTrophy, FaUser, FaWhatsapp, FaEnvelope, FaTimes } from 'react-icons/fa';

function QuestionPool({ token }) {
  const { tokenId } = useParams(); // Get tokenId from URL
  const [questions, setQuestions] = useState({ mcqs: [], descriptive: [], totalMCQs: 0, totalDescriptive: 0, subject: 'General' });
  const [message, setMessage] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [desiredMCQs, setDesiredMCQs] = useState(5);
  const [desiredDescriptive, setDesiredDescriptive] = useState(3);
  const [showTestTokenModal, setShowTestTokenModal] = useState(false);
  const [testToken, setTestToken] = useState('');
  const navigate = useNavigate();

  // Fetch questions on component mount
  useEffect(() => {
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
    fetchQuestions();
  }, [tokenId, token, desiredMCQs, desiredDescriptive]);

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
      setTestToken(res.data.testToken);
      setShowTestTokenModal(true);
      setMessage(`Test created! Token: ${res.data.testToken}`);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to create test');
    }
  };

  const handleViewResults = () => {
    navigate(`/leaderboard/${tokenId}`);
  };

  const formatOptions = (options) => {
    return options.map((opt, index) => `${String.fromCharCode(97 + index)}. ${opt}`).join('<br />');
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="text-center">Question Pool</h2>
        <h3 className="mt-4">Token: {tokenId} | Subject: {questions.subject}</h3>

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
                  <div className="ml-6 mt-2 p-2 border rounded">
                    <p><strong>Options:</strong></p>
                    <ul>
                      {q.options.map((opt, index) => (
                        <li key={index}>
                          {String.fromCharCode(97 + index)}. {opt}
                        </li>
                      ))}
                    </ul>
                    <p><strong>Correct Answer:</strong> {q.correctAnswer}</p>
                    <p><strong>Context:</strong> {q.context}</p>
                    <p><strong>Difficulty:</strong> {q.difficulty}</p>
                    
                  </div>
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
                    
                  </div>
                )}
              </div>
            ))}
          </>
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
                className="w-full p-2 border rounded"
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
                className="w-full p-2 border rounded"
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
        {message && <p className={`text-center mt-4 ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}

        {showTestTokenModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
              <h3 className="text-lg font-bold mb-2">Test Created Successfully!</h3>
              <p className="mb-2"><strong>Test Token:</strong> {testToken}</p>
              <p className="mb-4"><strong>Subject:</strong> {questions.subject}</p>
              <div className="flex justify-center space-x-4">
                <a
                  href={`https://api.whatsapp.com/send?text=Here%20is%20my%20QMaster%20test%20token:%20${testToken}%20(Subject:%20${questions.subject})`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 text-white p-2 rounded flex items-center space-x-2"
                >
                  <FaWhatsapp />
                  <span>Share via WhatsApp</span>
                </a>
                <a
                  href={`mailto:?subject=QMaster%20Test%20Token&body=Here%20is%20my%20QMaster%20test%20token:%20${testToken}%20(Subject:%20${questions.subject})`}
                  className="bg-red-500 text-white p-2 rounded flex items-center space-x-2"
                >
                  <FaEnvelope />
                  <span>Share via Gmail</span>
                </a>
              </div>
              <button
                onClick={() => setShowTestTokenModal(false)}
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

export default QuestionPool;