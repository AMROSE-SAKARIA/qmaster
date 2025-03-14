import { useNavigate } from 'react-router-dom';

function Navbar({ token, setToken }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/signin');
  };

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container flex justify-between items-center">
        <h1 className="text-xl font-bold">QMaster</h1>
        <div>
          <a href="/" className="mr-4">Home</a>
          <a href="/about" className="mr-4">About</a>
          {token ? (
            <>
              {localStorage.getItem('role') === 'teacher' && <a href="/teacher" className="mr-4">Teacher</a>}
              {localStorage.getItem('role') === 'student' && <a href="/student" className="mr-4">Student</a>}
              <button onClick={handleLogout} className="bg-red-500 p-2 rounded">
                Logout
              </button>
            </>
          ) : (
            <>
              <a href="/signin" className="mr-4">Sign In</a>
              <a href="/signup">Sign Up</a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;