import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function Leaderboard({ token }) {
  const { token: testToken } = useParams();
  const [leaderboard, setLeaderboard] = useState({ submissions: [], classAverage: 0, totalQuestions: 0 });

  useEffect(() => {
    if (testToken) {
      axios.get(`http://localhost:5000/leaderboard/${testToken}`, { headers: { 'authorization': token } })
        .then(res => setLeaderboard(res.data))
        .catch(err => console.error('Failed to fetch leaderboard:', err));
    }
  }, [testToken, token]);

  return (
    <div className="container">
      <h2 className="text-2xl font-bold mb-4 text-blue-600">Leaderboard - Token: {testToken}</h2>
      <div className="bg-white p-6 rounded shadow-md">
        <p>Average Score: {leaderboard.classAverage.toFixed(2)}</p>
        <p>Total Questions: {leaderboard.totalQuestions}</p>
        <ol>
          {leaderboard.submissions.map((sub, index) => (
            <li key={sub._id} className="mb-2">
              {index + 1}. {sub.studentName}: {sub.score}/{sub.totalMarks}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default Leaderboard;