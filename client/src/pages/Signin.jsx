import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Signin({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/login', { username, password }, { timeout: 5000 });
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', username);
      localStorage.setItem('role', res.data.role);
      navigate(res.data.role === 'teacher' ? '/teacher' : '/student');
    } catch (error) {
      setError(`Signin failed: ${error.response?.data?.error || error.message || 'Network Error'}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">Sign In</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSignin} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border p-2 w-full rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 w-full rounded"
            required
          />
          <button type="submit" className="bg-blue-500 text-white p-2 w-full rounded hover:bg-blue-600">
            Sign In
          </button>
        </form>
        <p className="mt-2 text-center">
          Don't have an account? <a href="/signup" className="text-blue-500">Sign Up</a>
        </p>
      </div>
    </div>
  );
}

export default Signin;