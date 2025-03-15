import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Signup({ setToken, setRole }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [localRole, setLocalRole] = useState('student');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/register', { username, password, email, role: localRole });
      setStep(2);
      setMessage('OTP sent to your email');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Registration failed');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/verify-otp', { username, password, role: localRole, otp });
      setMessage('Registration successful! Please sign in.');
      navigate('/signin');
    } catch (error) {
      setMessage(error.response?.data?.error || 'OTP verification failed');
    }
  };

  return (
    <div className="app">
      <div className="container">
        <div className="card">
          <h2>Sign Up</h2>
          {step === 1 ? (
            <form onSubmit={handleRegister}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
              />
              <select value={localRole} onChange={(e) => setLocalRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              <button type="submit">Register</button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
              />
              <button type="submit">Verify OTP</button>
            </form>
          )}
          {message && <p className={message.includes('successful') ? 'text-green-500' : 'error'}>{message}</p>}
          <p>
            Already have an account? <Link to="/signin">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;