import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaEye } from 'react-icons/fa'; // Import FaEye for the view button

function Profile({ token, role }) {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (error) {
        setMessage(error.response?.data?.error || 'Failed to fetch profile');
      }
    };
    fetchProfile();
  }, [token]);

  if (!profile) return <div>Loading...</div>;

  const handleViewPerformance = (token) => {
    navigate(`/teacher/question-history/${token}`);
  };

  return (
    <div className="app">
      <div className="container">
        <div className="card">
          <h2>User Profile</h2>
          <p><strong>Username:</strong> {profile.username}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Role:</strong> {profile.role}</p>
          {role === 'teacher' && profile.conductedTests.length > 0 && (
            <div>
              <h4>Conducted Tests</h4>
              {profile.conductedTests.map((test, index) => (
                <div key={index} className="mb-2">
                  <p>
                    <strong>Token:</strong> {test.token}, <strong>Subject:</strong> {test.subject || 'General'}, 
                    <strong> Date:</strong> {new Date(test.createdAt).toLocaleString()}, 
                    <strong> MCQs:</strong> {test.numMCQs}, <strong> Descriptive:</strong> {test.numDescriptive}
                    <button
                      onClick={() => handleViewPerformance(test.token)}
                      className="ml-2 bg-blue-500 text-white p-1 rounded text-sm flex items-center space-x-1 inline-block"
                    >
                      <FaEye />
                      <span>View Performance</span>
                    </button>
                  </p>
                </div>
              ))}
            </div>
          )}
          {role === 'student' && profile.attendedTests.length > 0 && (
            <div>
              <h4>Attended Tests</h4>
              {profile.attendedTests.map((test, index) => (
                <div key={index} className="mb-2">
                  <p>
                    <strong>Token:</strong> {test.token}, 
                    <strong> Date:</strong> {new Date(test.submittedAt).toLocaleString()}, 
                    <strong> Score:</strong> {test.score}/{test.totalMarks}
                  </p>
                </div>
              ))}
            </div>
          )}
          {message && <p className={message.includes('success') ? 'text-green-500' : 'text-red-500'}>{message}</p>}
          <button onClick={() => navigate('/')} className="bg-gray-500 text-white p-2 rounded mt-4">
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;