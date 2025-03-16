import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaSignInAlt, FaUserPlus, FaKey } from 'react-icons/fa';

function Signin({ setToken, setRole }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('send-otp'); // Manage flow: 'send-otp' or 'enter-otp'
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', {
        username,
        password,
      });
      setToken(res.data.token);
      setRole(res.data.role);
      setMessage('Login successful');
      navigate('/');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Login failed');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/forgot-password', {
        username: forgotUsername,
      });
      setMessage(res.data.message);
      setStep('enter-otp'); // Move to OTP entry step
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to send OTP');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/reset-password', {
        username: forgotUsername,
        otp: forgotOtp,
        newPassword,
        confirmPassword,
      });
      setMessage(res.data.message);
      setForgotPassword(false);
      setForgotUsername('');
      setForgotOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setStep('send-otp'); // Reset to initial step
    } catch (error) {
      setMessage(error.response?.data?.error || 'Password reset failed');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="text-center">Login</h2>
        {!forgotPassword ? (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700 mb-1">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 mb-1">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex justify-center space-x-4">
              <button type="submit" className="bg-blue-500 text-white p-2 rounded flex items-center space-x-2">
                <FaSignInAlt />
                <span>Login</span>
              </button>
              <button type="button" onClick={() => navigate('/signup')} className="bg-green-500 text-white p-2 rounded flex items-center space-x-2">
                <FaUserPlus />
                <span>Go to Register</span>
              </button>
            </div>
            <p className="text-center mt-2 text-blue-500 cursor-pointer" onClick={() => setForgotPassword(true)}>
              Forgot Password?
            </p>
          </form>
        ) : (
          <form onSubmit={step === 'enter-otp' ? handleResetPassword : handleForgotPassword}>
            <div className="mb-4">
              <label htmlFor="forgotUsername" className="block text-gray-700 mb-1">Username</label>
              <input
                type="text"
                id="forgotUsername"
                value={forgotUsername}
                onChange={(e) => setForgotUsername(e.target.value)}
                placeholder="Username"
                className="w-full p-2 border rounded"
              />
            </div>
            {step === 'send-otp' && (
              <div className="flex justify-center">
                <button type="submit" className="bg-blue-500 text-white p-2 rounded flex items-center space-x-2">
                  <FaKey />
                  <span>Send OTP</span>
                </button>
              </div>
            )}
            {step === 'enter-otp' && (
              <>
                <div className="mb-4">
                  <label htmlFor="forgotOtp" className="block text-gray-700 mb-1">Enter OTP</label>
                  <input
                    type="text"
                    id="forgotOtp"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="Enter OTP"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="newPassword" className="block text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="block text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex justify-center">
                  <button type="submit" className="bg-blue-500 text-white p-2 rounded flex items-center space-x-2">
                    <FaKey />
                    <span>Reset Password</span>
                  </button>
                </div>
              </>
            )}
            <p className="text-center mt-2 text-blue-500 cursor-pointer" onClick={() => {
              setForgotPassword(false);
              setForgotUsername('');
              setForgotOtp('');
              setNewPassword('');
              setConfirmPassword('');
              setStep('send-otp');
            }}>
              Back to Login
            </p>
            {message && <p className={`text-center mt-4 ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}
          </form>
        )}
      </div>
    </div>
  );
}

export default Signin;