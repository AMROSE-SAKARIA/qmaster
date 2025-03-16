import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

function SubmissionReview({ token, role }) {
  const { tokenId, studentName } = useParams(); // Added studentName from route params
  const [submission, setSubmission] = useState(null);
  const [questions, setQuestions] = useState({ mcqs: [], descriptive: [] });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (role !== 'teacher') {
      navigate('/');
      return;
    }
    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/teacher/results/${tokenId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        // Filter submission for the selected student
        const studentSubmission = res.data.submissions.find(
          (sub) => sub.studentName.toLowerCase() === decodeURIComponent(studentName).toLowerCase()
        );
        if (studentSubmission) {
          setSubmission(studentSubmission);
        } else {
          setMessage(`No submission found for student: ${decodeURIComponent(studentName)}`);
          setSubmission(null);
        }

        const questionRes = await axios.get(`http://localhost:5000/api/teacher/questions/${tokenId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setQuestions(questionRes.data);
      } catch (error) {
        setMessage(error.response?.data?.error || 'Failed to fetch submissions');
      }
    };
    fetchData();
  }, [token, tokenId, studentName, role, navigate]);

  if (!submission && !message) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app">
      <div className="container">
        <div className="card">
          <h2>Submission Review</h2>
          {submission ? (
            <div className="mb-4 p-2 border rounded">
              <p><strong>Student:</strong> {submission.studentName}</p>
              <p><strong>Score:</strong> {submission.score}/{submission.totalMarks}</p>
              <h4>MCQ Answers</h4>
              {submission.answers.mcq?.map((ans, i) => {
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
              {submission.answers.descriptive?.map((ans, i) => {
                const question = questions.descriptive.find(q => q._id === ans.id);
                return (
                  <div key={i} className="ml-4">
                    <p><strong>Question:</strong> {question?.question}</p>
                    <p><strong>Answer:</strong> {ans.answer}</p>
                    <p><strong>Correct Answer:</strong> {question?.correctAnswer}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-red-500">{message}</p>
          )}
          {message && !submission && <p className={message.includes('success') ? 'text-green-500' : 'text-red-500'}>{message}</p>}
          <button onClick={() => navigate(`/leaderboard/${tokenId}`)} className="bg-gray-500 text-white p-2 rounded mt-4">
            <FaArrowLeft />
            <span> Back to Leaderboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubmissionReview;