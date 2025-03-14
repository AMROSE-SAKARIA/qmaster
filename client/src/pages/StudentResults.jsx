import { useState, useEffect } from 'react';
import axios from 'axios';

function StudentResults({ token }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/student/results', { headers: { 'authorization': token } })
      .then(res => setResults(res.data))
      .catch(err => console.error('Failed to fetch results:', err));
  }, [token]);

  return (
    <div className="container">
      <h2 className="text-2xl font-bold mb-4 text-blue-600">My Results</h2>
      <div className="bg-white p-6 rounded shadow-md">
        {results.length > 0 ? (
          <ul>
            {results.map((result) => (
              <li key={result._id} className="mb-2">
                Token: {result.token}, Score: {result.score}/{result.totalMarks}
              </li>
            ))}
          </ul>
        ) : (
          <p>No results available.</p>
        )}
      </div>
    </div>
  );
}

export default StudentResults;