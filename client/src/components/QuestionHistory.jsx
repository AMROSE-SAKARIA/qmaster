import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

function QuestionHistory({ token, role }) {
  const { tokenId } = useParams();
  const [questionHistory, setQuestionHistory] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (role !== 'teacher') {
      navigate('/');
      return;
    }
    const fetchQuestionHistory = async () => {
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
    fetchQuestionHistory();
  }, [tokenId, token, role, navigate]);

  // Format options with letters (a, b, c, d)
  const formatOptions = (options) => {
    return options.map((opt, index) => `${String.fromCharCode(97 + index)}. ${opt}`).join('<br />');
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="text-center">Question History for Token: {tokenId}</h2>
        {questionHistory.length > 0 ? (
          <div className="mt-4">
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
        ) : (
          <p>No questions found for this token.</p>
        )}
        {message && <p className={`text-center mt-4 ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}
        <button onClick={() => navigate('/profile')} className="bg-gray-500 flex items-center space-x-2 mt-4">
          <FaArrowLeft />
          <span>Back to Profile</span>
        </button>
      </div>
    </div>
  );
}

export default QuestionHistory;