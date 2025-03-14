import { useState, useEffect } from 'react';
import axios from 'axios';

function StudentDashboard({ token }) {
  const [questions, setQuestions] = useState({ mcqs: [], descriptive: [] });
  const [answers, setAnswers] = useState({ mcq: [], descriptive: [] });
  const [tokenInput, setTokenInput] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (tokenInput) {
      axios.post('http://localhost:5000/student/join', { token: tokenInput }, { headers: { 'authorization': token } })
        .then(res => {
          setQuestions(res.data);
          setMessage('');
        })
        .catch(err => setMessage(`Join failed: ${err.response?.data?.error || err.message || 'Network Error'}`));
    }
  }, [tokenInput, token]);

  const handleMCQChange = (id, value) => {
    setAnswers(prev => ({
      ...prev,
      mcq: prev.mcq.filter(a => a.id !== id).concat({ id, answer: value }).slice(0, 5),
    }));
  };

  const handleDescriptiveChange = (id, value) => {
    setAnswers(prev => ({
      ...prev,
      descriptive: prev.descriptive.filter(a => a.id !== id).concat({ id, answer: value }).slice(0, 10),
    }));
  };

  const handleSubmit = () => {
    if (!answers.mcq.length && !answers.descriptive.length) {
      setMessage('Please answer at least one question');
      return;
    }
    axios.post('http://localhost:5000/student/submit', {
      token: tokenInput,
      answers,
      studentName: localStorage.getItem('username'),
    }, { headers: { 'authorization': token } })
      .then(res => {
        setResult(res.data);
        setMessage('');
      })
      .catch(err => setMessage(`Submit failed: ${err.response?.data?.error || err.message || 'Network Error'}`));
  };

  return (
    <div className="container">
      <h2 className="text-2xl font-bold mb-4 text-blue-600">Student Dashboard</h2>
      {!questions.mcqs.length && !questions.descriptive.length && (
        <div className="bg-white p-6 rounded shadow-md">
          <input
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Enter Test Token"
            className="border p-2 w-full rounded mb-4"
          />
          <button
            onClick={() => {
              if (tokenInput) setTokenInput(tokenInput);
            }}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Join Test
          </button>
        </div>
      )}
      {questions.mcqs.length > 0 && (
        <div className="bg-white p-6 rounded shadow-md mb-6">
          <h3 className="text-xl font-semibold mb-4">MCQs</h3>
          {questions.mcqs.map((q) => (
            <div key={q._id} className="mb-4">
              <p>{q.question}</p>
              {q.options.map((opt) => (
                <div key={opt} className="ml-4">
                  <input
                    type="radio"
                    name={`mcq-${q._id}`}
                    value={opt}
                    checked={answers.mcq.find(a => a.id === q._id)?.answer === opt}
                    onChange={() => handleMCQChange(q._id, opt)}
                  /> {opt}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {questions.descriptive.length > 0 && (
        <div className="bg-white p-6 rounded shadow-md mb-6">
          <h3 className="text-xl font-semibold mb-4">Descriptive Questions</h3>
          {questions.descriptive.map((q) => (
            <div key={q._id} className="mb-4">
              <p>{q.question}</p>
              <textarea
                value={answers.descriptive.find(a => a.id === q._id)?.answer || ''}
                onChange={(e) => handleDescriptiveChange(q._id, e.target.value)}
                className="border p-2 w-full h-20 rounded"
              />
            </div>
          ))}
        </div>
      )}
      {(questions.mcqs.length > 0 || questions.descriptive.length > 0) && (
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Submit
        </button>
      )}
      {message && <p className={message.includes('failed') ? 'text-red-500' : 'text-green-500'}>{message}</p>}
      {result && <p className="mt-4 text-green-500">Score: {result.score}/{result.total}</p>}
    </div>
  );
}

export default StudentDashboard;