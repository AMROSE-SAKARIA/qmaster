import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import StudentResults from './pages/StudentResults';
import Leaderboard from './pages/Leaderboard';
import Home from './pages/Home';
import About from './pages/About';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  return (
    <Router>
      <Navbar token={token} setToken={setToken} />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<Signin setToken={setToken} />} />
          <Route path="/signup" element={<Signup setToken={setToken} />} />
          <Route
            path="/teacher"
            element={
              token && localStorage.getItem('role') === 'teacher' ? (
                <TeacherDashboard token={token} setToken={setToken} />
              ) : (
                <Signin setToken={setToken} />
              )
            }
          />
          <Route
            path="/student"
            element={
              token && localStorage.getItem('role') === 'student' ? (
                <StudentDashboard token={token} setToken={setToken} />
              ) : (
                <Signin setToken={setToken} />
              )
            }
          />
          <Route path="/student/results" element={<StudentResults token={token} />} />
          <Route path="/leaderboard/:token" element={<Leaderboard token={token} />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Signin setToken={setToken} />} /> {/* Fallback route */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;