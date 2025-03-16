import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ token, setToken, setRole, role, tokenId }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken('');
    setRole('');
    navigate('/');
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">QMaster</Link>
        <div className="space-x-4">
          <Link to="/about" className="hover:underline">About</Link>
          {token ? (
            <>
              {role === 'teacher' && (
                <>
                  <Link to="/teacher" className="hover:underline">Teacher Dashboard</Link>
                  {tokenId && (
                    <>
                      <Link to={`/leaderboard/${tokenId}`} className="hover:underline">Leaderboard</Link>
                      <Link to={`/submissions/${tokenId}`} className="hover:underline">Submissions</Link>
                    </>
                  )}
                </>
              )}
              {role === 'student' && (
                <>
                  <Link to="/student" className="hover:underline">Student Dashboard</Link>
                  <Link to="/results" className="hover:underline">Results</Link>
                </>
              )}
              <Link to="/profile" className="hover:underline">Profile</Link>
              <button onClick={handleLogout} className="hover:underline">Logout</button>
            </>
          ) : (
            <>
              <Link to="/signin" className="hover:underline">Sign In</Link>
              <Link to="/signup" className="hover:underline">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;