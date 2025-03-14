import { useState, useEffect } from 'react';
import axios from 'axios';

function Student({ token }) {
  const [questions, setQuestions] = useState({ mcqs: [], descriptive: [] });
  const [answers, setAnswers] = useState({ mcq: [], descriptive: [] });
  const [tokenInput, setTokenInput] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (tokenInput) {
      axios.post('http://localhost:5000/student/join', { token: tokenInput }, { headers: { 'authorization': token } })
        .then(res => setQuestions(res.data))
        .catch(err => setMessage(`Join failed: ${err.response?.data?.error || err.message}`));
    }
  }, [tokenInput, token]);

  const handleSubmit = () => {
    axios.post('http://localhost:5000/student/submit', {
      token: tokenInput,
      answers,
      studentName: localStorage.getItem('username'),
    }, { headers: { 'authorization': token } })
      .then(res => setResult(res.data))
      .catch(err => setMessage(`Submit failed: ${err.response?.data?.error || err.message}`));
  };

  const handleMCQChange = (id, value) => {
    setAnswers(prev => ({
      ...prev,
      mcq: prev.mcq.map(a => a.id === id ? { ...a, answer: value } : a).filter(a => a.id === id || !a.answer)
        .concat({ id, answer: value }).slice(0, 5),
    }));
  };

  const handleDescriptiveChange = (id, value) => {
    setAnswers(prev => ({
      ...prev,
      descriptive: prev.descriptive.map(a => a.id === id ? { ...a, answer: value } : a).filter(a => a.id === id || !a.answer)
        .concat({ id, answer: value }).slice(0, 10),
    }));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Student Dashboard</h2>
      {!questions.mcqs.length && !questions.descriptive.length && (
        <input
          type="text"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="Enter Test Token"
          className="border p-2 w-full mb-4"
        />
      )}
      {questions.mcqs.length > 0 && (
        <div>
          <h3>MCQs</h3>
          {questions.mcqs.map((q, i) => (
            <div key={q._id} className="mb-4">
              <p>{i + 1}. {q.question}</p>
              {q.options.map((opt, j) => (
                <div key={j}>
                  <input
                    type="radio"
                    name={`mcq-${q._id}`}
                    value={opt}
                    onChange={() => handleMCQChange(q._id, opt)}
                  /> {opt}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {questions.descriptive.length > 0 && (
        <div>
          <h3>Descriptive Questions</h3>
          {questions.descriptive.map((q, i) => (
            <div key={q._id} className="mb-4">
              <p>{i + 1}. {q.question}</p>
              <textarea
                value={(answers.descriptive.find(a => a.id === q._id)?.answer) || ''}
                onChange={(e) => handleDescriptiveChange(q._id, e.target.value)}
                className="border p-2 w-full h-20"
              />
            </div>
          ))}
        </div>
      )}
      {(questions.mcqs.length > 0 || questions.descriptive.length > 0) && (
        <button onClick={handleSubmit} className="bg-blue-500 text-white p-2 rounded">Submit</button>
      )}
      {message && <p className="mt-4 text-red-500">{message}</p>}
      {result && <p className="mt-4">Score: {result.score}/{result.total}</p>}
    </div>
  );
}

export default Student;