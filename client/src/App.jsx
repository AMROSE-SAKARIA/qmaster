import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import StudentResults from './pages/StudentResults.jsx';
import Teacher from './components/Teacher.jsx';
import Profile from './components/Profile.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import SubmissionReview from './components/SubmissionReview.jsx';
import QuestionHistory from './components/QuestionHistory.jsx';
import About from './pages/About.jsx';
import Signin from './pages/Signin.jsx';
import Signup from './pages/Signup.jsx';
import QuestionPool from './components/QuestionPool.jsx'; // Import the new component
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [role, setRole] = useState(localStorage.getItem('role') || '');
  const [tokenId, setTokenId] = useState(localStorage.getItem('tokenId') || '');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('tokenId', tokenId);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('tokenId');
      setTokenId('');
    }
  }, [token, role, tokenId]);

  return (
    <Router>
      <div className="app">
        <Navbar token={token} setToken={setToken} setRole={setRole} role={role} tokenId={tokenId} />
        <div className="container">
          <div className="card">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route
                path="/signin"
                element={token ? <Navigate to={role === 'teacher' ? '/teacher' : '/student'} /> : <Signin setToken={setToken} setRole={setRole} />}
              />
              <Route
                path="/signup"
                element={token ? <Navigate to={role === 'teacher' ? '/teacher' : '/student'} /> : <Signup />}
              />
              <Route path="/about" element={<About />} />

              {/* Protected Routes */}
              <Route
                path="/teacher"
                element={token && role === 'teacher' ? <Teacher token={token} role={role} setTokenId={setTokenId} /> : <Navigate to="/signin" />}
              />
              <Route
                path="/student"
                element={token && role === 'student' ? <StudentDashboard token={token} role={role} /> : <Navigate to="/signin" />}
              />
              <Route
                path="/profile"
                element={token ? <Profile token={token} role={role} /> : <Navigate to="/signin" />}
              />
              <Route
                path="/leaderboard/:tokenId"
                element={token ? <Leaderboard token={token} role={role} /> : <Navigate to="/signin" />}
              />
              <Route
                path="/submissions/:tokenId/:studentName"
                element={token && role === 'teacher' ? <SubmissionReview token={token} role={role} /> : <Navigate to="/signin" />}
              />
              <Route
                path="/results"
                element={token && role === 'student' ? <StudentResults token={token} role={role} /> : <Navigate to="/signin" />}
              />
              <Route
                path="/teacher/question-history/:tokenId"
                element={token && role === 'teacher' ? <QuestionHistory token={token} role={role} /> : <Navigate to="/signin" />}
              />
              <Route
                path="/teacher/questions/:tokenId"
                element={token && role === 'teacher' ? <QuestionPool token={token} /> : <Navigate to="/signin" />}
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;