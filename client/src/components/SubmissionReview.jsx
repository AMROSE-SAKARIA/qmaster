import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function SubmissionReview({ token, role }) {
  const { tokenId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [questions, setQuestions] = useState({ mcqs: [], descriptive: [] });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/teacher/results/${tokenId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setSubmissions(res.data.submissions);

        const questionRes = await axios.get(`http://localhost:5000/api/teacher/questions/${tokenId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setQuestions(questionRes.data);
      } catch (error) {
        setMessage(error.response?.data?.error || 'Failed to fetch submissions');
      }
    };
    fetchData();
  }, [token, tokenId]);

  return (
    <div className="app">
      <div className="container">
        <div className="card">
          <h2>Submission Review</h2>
          {submissions.length === 0 ? (
            <p>No submissions yet.</p>
          ) : (
            submissions.map((sub, index) => (
              <div key={index} className="mb-4 p-2 border rounded">
                <p><strong>Student:</strong> {sub.studentName}</p>
                <p><strong>Score:</strong> {sub.score}/{sub.totalMarks}</p>
                <h4>MCQ Answers</h4>
                {sub.answers.mcq?.map((ans, i) => {
                  const question = questions.mcqs.find(q => q._id === ans.id);
                  return (
                    <div key={i} className="ml-4">
                      <p>
                        {i + 1}. {question?.question}: {ans.answer} (Correct: {question?.correctAnswer})
                      </p>
                    </div>
                  );
                })}
                <h4>Descriptive Answers</h4>
                {sub.answers.descriptive?.map((ans, i) => {
                  const question = questions.descriptive.find(q => q._id === ans.id);
                  return (
                    <div key={i} className="ml-4">
                      <p>{i + 1}. {question?.question}</p>
                      <p><strong>Answer:</strong> {ans.answer}</p>
                      <p><strong>Correct Answer:</strong> {question?.correctAnswer}</p>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          {message && <p className={message.includes('success') ? 'text-green-500' : 'text-red-500'}>{message}</p>}
          <button onClick={() => navigate(`/leaderboard/${tokenId}`)} className="bg-gray-500 text-white p-2 rounded mt-4">
            Back to Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubmissionReview;