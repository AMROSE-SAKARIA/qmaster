import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignInAlt, FaUserPlus, FaInfoCircle } from 'react-icons/fa';
import signin from './Signin';
import signup from './Signup';
import about from './About';
function Home() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <div className="card text-center">
        <h2 className="text-2xl font-bold">Welcome to QMaster</h2>
        <p className="text-gray-600 mb-6">Please sign in or sign up to continue.</p>
        <div className="flex justify-center space-x-4">
          <button onClick={() => navigate('/signin')} className="bg-blue-500 flex items-center space-x-2">
            <FaSignInAlt />
            <span>Sign In</span>
          </button>
          <button onClick={() => navigate('/signup')} className="bg-green-500 flex items-center space-x-2">
            <FaUserPlus />
            <span>Sign Up</span>
          </button>
          <button onClick={() => navigate('/about')} className="bg-gray-500 flex items-center space-x-2">
            <FaInfoCircle />
            <span>About</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;