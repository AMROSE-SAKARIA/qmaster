import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignInAlt, FaUserPlus, FaInfoCircle } from 'react-icons/fa';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Welcome to QMaster</h2>
        <p className="text-gray-600 mb-6">Please sign in or sign up to continue.</p>
        <div className="flex justify-center space-x-4">
          <button onClick={() => navigate('/signin')} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center space-x-2">
            <FaSignInAlt />
            <span>Sign In</span>
          </button>
          <button onClick={() => navigate('/signup')} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center space-x-2">
            <FaUserPlus />
            <span>Sign Up</span>
          </button>
          <button onClick={() => navigate('/about')} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center space-x-2">
            <FaInfoCircle />
            <span>About</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;