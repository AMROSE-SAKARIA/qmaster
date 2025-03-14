import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Signup({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('teacher');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setOtpMessage('');
    try {
      const res = await axios.post('http://localhost:5000/register', { username, password, role, email });
      setOtpMessage(res.data.message);
    } catch (error) {
      setError(`Signup failed: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('http://localhost:5000/verify-otp', { username, password, role, otp });
      alert('Registration successful! Please sign in.');
      navigate('/signin');
    } catch (error) {
      setError(`OTP verification failed: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">Sign Up</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {otpMessage && <p className="text-blue-500 mb-4">{otpMessage}</p>}
        <form onSubmit={otpMessage ? handleVerifyOtp : handleSignup} className="space-y-4">
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
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 w-full rounded"
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border p-2 w-full rounded"
          >
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
          {otpMessage && (
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="border p-2 w-full rounded"
              required
            />
          )}
          <button type="submit" className="bg-blue-500 text-white p-2 w-full rounded hover:bg-blue-600">
            {otpMessage ? 'Verify OTP' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-2 text-center">
          Already have an account? <a href="/signin" className="text-blue-500">Sign In</a>
        </p>
      </div>
    </div>
  );
}

export default Signup;