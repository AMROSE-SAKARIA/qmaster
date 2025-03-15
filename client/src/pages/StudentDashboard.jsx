import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function StudentDashboard({ token, role }) {
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
      setQuestions({ mcqs: res.data.mcqs, descriptive: res.data.descriptive });
      setAnswers({
        mcq: res.data.mcqs.map(q => ({ id: q._id, answer: '' })),
        descriptive: res.data.descriptive.map(q => ({ id: q._id, answer: '' })),
      });
      setMessage('Test joined successfully');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to join test');
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/student/submit', {
        token: tokenId,
        answers,
      }, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setMessage(`Test submitted! Score: ${res.data.score}/${res.data.total}`);
      navigate(`/leaderboard/${tokenId}`);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Submission failed');
    }
  };

  return (
    <div className="app">
      <div className="container">
        <div className="card">
          <h2>Student Dashboard</h2>
          <input
            type="text"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="Enter Test Token"
          />
          <button onClick={handleJoinTest}>Join Test</button>

          {questions.mcqs.length > 0 && (
            <>
              <h3>MCQs</h3>
              {questions.mcqs.map((q, index) => (
                <div key={q._id}>
                  <p>{index + 1}. {q.question}</p>
                  {q.options.map((option, i) => (
                    <label key={i}>
                      <input
                        type="radio"
                        name={`mcq-${q._id}`}
                        value={option}
                        onChange={(e) => {
                          const newAnswers = [...answers.mcq];
                          newAnswers[index].answer = e.target.value;
                          setAnswers({ ...answers, mcq: newAnswers });
                        }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              ))}
            </>
          )}

          {questions.descriptive.length > 0 && (
            <>
              <h3>Descriptive Questions</h3>
              {questions.descriptive.map((q, index) => (
                <div key={q._id}>
                  <p>{index + 1}. {q.question}</p>
                  <textarea
                    value={answers.descriptive[index]?.answer || ''}
                    onChange={(e) => {
                      const newAnswers = [...answers.descriptive];
                      newAnswers[index].answer = e.target.value;
                      setAnswers({ ...answers, descriptive: newAnswers });
                    }}
                    placeholder="Type your answer here"
                  />
                </div>
              ))}
            </>
          )}

          {(questions.mcqs.length > 0 || questions.descriptive.length > 0) && (
            <button onClick={handleSubmit}>Submit Test</button>
          )}

          {message && <p className={message.includes('success') ? 'text-green-500' : 'error'}>{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;