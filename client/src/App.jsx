import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Signin from './pages/Signin.jsx';
import Signup from './pages/Signup.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import StudentResults from './pages/StudentResults.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Navbar from './components/Navbar.jsx';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [role, setRole] = useState(localStorage.getItem('role') || '');

  return (
    <Router>
      <div className="app">
        <Navbar token={token} setToken={setToken} setRole={setRole} role={role} />
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/signin" element={<Signin setToken={setToken} setRole={setRole} />} />
            <Route path="/signup" element={<Signup setToken={setToken} setRole={setRole} />} />
            <Route path="/teacher" element={<TeacherDashboard token={token} role={role} />} />
            <Route path="/student" element={<StudentDashboard token={token} role={role} />} />
            <Route path="/student/results" element={<StudentResults token={token} role={role} />} />
            <Route path="/leaderboard/:token" element={<Leaderboard token={token} role={role} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;