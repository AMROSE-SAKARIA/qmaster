import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FaEye } from 'react-icons/fa'; // Import FaEye for the view button

function Leaderboard({ token, role }) {
  const { tokenId } = useParams();
  const [leaderboard, setLeaderboard] = useState([]);
  const [classAverage, setClassAverage] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/leaderboard/${tokenId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setLeaderboard(res.data.leaderboard);
        setClassAverage(res.data.classAverage);
        setTotalQuestions(res.data.totalQuestions);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [token, tokenId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="app">
      <div className="container">
        <div className="card">
          <h2>Leaderboard</h2>
          <p><strong>Class Average:</strong> {classAverage}</p>
          <p><strong>Total Questions:</strong> {totalQuestions}</p>
          {leaderboard.length === 0 ? (
            <p>No submissions yet.</p>
          ) : (
            <table className="w-full mt-4">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2">Rank</th>
                  <th className="p-2">Student</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Date</th>
                  {role === 'teacher' && <th className="p-2">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{entry.rank}</td>
                    <td className="p-2">{entry.studentName}</td>
                    <td className="p-2">{entry.score}/{entry.totalMarks}</td>
                    <td className="p-2">{new Date(entry.submittedAt).toLocaleString()}</td>
                    {role === 'teacher' && (
                      <td className="p-2">
                        <button
                          onClick={() => navigate(`/submissions/${tokenId}/${encodeURIComponent(entry.studentName)}`)}
                          className="bg-blue-500 text-white p-1 rounded flex items-center space-x-1"
                        >
                          <FaEye />
                          <span>View Submission</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button onClick={() => navigate('/')} className="bg-gray-500 text-white p-2 rounded mt-4 ml-2">
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;