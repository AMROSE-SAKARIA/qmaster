import { Link, useNavigate } from 'react-router-dom';

function Navbar({ token, setToken, setRole, role }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken('');
    setRole('');
    navigate('/');
  };

  return (
    <nav>
      <div className="container flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">QMaster</Link>
        <div>
          <Link to="/" className="mr-4">Home</Link>
          <Link to="/about" className="mr-4">About</Link>
          {token ? (
            <>
              {role === 'teacher' && <Link to="/teacher" className="mr-4">Teacher Dashboard</Link>}
              {role === 'student' && <Link to="/student" className="mr-4">Student Dashboard</Link>}
              {role === 'student' && <Link to="/student/results" className="mr-4">Results</Link>}
              <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </>
          ) : (
            <>
              <Link to="/signin" className="mr-4">Sign In</Link>
              <Link to="/signup">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;