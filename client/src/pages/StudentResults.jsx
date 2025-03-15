import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function StudentResults({ token, role }) {
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  if (role !== 'student') {
    navigate('/');
    return null;
  }

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/student/results', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setResults(res.data);
      } catch (error) {
        setMessage(error.response?.data?.error || 'Failed to fetch results');
      }
    };
    fetchResults();
  }, [token]);

  return (
    <div className="app">
      <div className="container">
        <div className="card">
          <h2>Your Results</h2>
          {results.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Test Token</th>
                  <th>Score</th>
                  <th>Total Marks</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index}>
                    <td>{result.token}</td>
                    <td>{result.score}</td>
                    <td>{result.totalMarks}</td>
                    <td>{new Date(result.submittedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No results found.</p>
          )}
          {message && <p className="error">{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default StudentResults;