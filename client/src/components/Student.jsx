import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Student({ token, role, onLogout }) {
  const [tokenId, setTokenId] = useState('');
  const [questions, setQuestions] = useState({ mcqs: [], descriptive: [] });
  const [answers, setAnswers] = useState({ mcq: [], descriptive: [] });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  if (role !== 'student') {
    navigate('/');
    return null;
  }

  const handleJoinTest = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/student/join', { token: tokenId }, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setQuestions(res.data);
      setAnswers({
        mcq: res.data.mcqs.map(q => ({ id: q._id, answer: '' })),
        descriptive: res.data.descriptive.map(q => ({ id: q._id, answer: '' })),
      });
      setMessage('Test joined successfully');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to join test');
    }
  };

  const handleSubmitTest = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/student/submit', {
        token: tokenId,
        answers,
      }, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setMessage(`Test submitted! Score: ${res.data.score}/${res.data.total}`);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to submit test');
    }
  };

  return (
    <div className="app">
      <div className="container">
        <div className="card">
          <h2>Student Dashboard</h2>
          <button onClick={() => navigate('/profile')} className="bg-blue-500 text-white p-2 rounded mb-4">
            View Profile
          </button>
          <button onClick={onLogout} className="bg-red-500 text-white p-2 rounded mb-4 ml-2">
            Logout
          </button>
          <h3>Join Test</h3>
          <input
            type="text"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="Enter Test Token"
            className="w-full p-2 border rounded mb-4"
          />
          <button onClick={handleJoinTest} className="bg-green-500 text-white p-2 rounded">
            Join Test
          </button>

          {questions.mcqs.length > 0 && (
            <>
              <h4 className="mt-4">MCQs</h4>
              {questions.mcqs.map((q, index) => (
                <div key={q._id} className="mb-4">
                  <p>{index + 1}. {q.question}</p>
                  {q.options.map((opt, i) => (
                    <div key={i}>
                      <input
                        type="radio"
                        name={`mcq-${q._id}`}
                        value={opt}
                        onChange={(e) => {
                          const newAnswers = [...answers.mcq];
                          newAnswers[index] = { id: q._id, answer: e.target.value };
                          setAnswers({ ...answers, mcq: newAnswers });
                        }}
                        className="mr-2"
                      />
                      <label>{opt}</label>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
          {questions.descriptive.length > 0 && (
            <>
              <h4 className="mt-4">Descriptive Questions</h4>
              {questions.descriptive.map((q, index) => (
                <div key={q._id} className="mb-4">
                  <p>{index + 1}. {q.question}</p>
                  <textarea
                    onChange={(e) => {
                      const newAnswers = [...answers.descriptive];
                      newAnswers[index] = { id: q._id, answer: e.target.value };
                      setAnswers({ ...answers, descriptive: newAnswers });
                    }}
                    placeholder="Your answer..."
                    className="w-full p-2 border rounded"
                    rows="3"
                  />
                </div>
              ))}
            </>
          )}
          {questions.mcqs.length > 0 && (
            <button onClick={handleSubmitTest} className="bg-blue-500 text-white p-2 rounded mt-4">
              Submit Test
            </button>
          )}
          {message && <p className={message.includes('success') ? 'text-green-500' : 'text-red-500'}>{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default Student;