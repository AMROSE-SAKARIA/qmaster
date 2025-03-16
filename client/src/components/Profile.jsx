import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';

function Profile({ token, role }) {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [newRealName, setNewRealName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setProfile(res.data);
        setNewRealName(res.data.realName);
        setNewEmail(res.data.email);
      } catch (error) {
        setMessage(error.response?.data?.error || 'Failed to fetch profile');
      }
    };
    fetchProfile();
  }, [token]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put('http://localhost:5000/api/profile/update', {
        realName: newRealName,
        email: newEmail,
        password: newPassword || undefined,
      }, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setMessage(res.data.message);
      setIsEditing(false);
      const updatedProfile = await axios.get('http://localhost:5000/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setProfile(updatedProfile.data);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleDeleteProfile = async () => {
    if (window.confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      try {
        const res = await axios.delete('http://localhost:5000/api/profile/delete', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setMessage(res.data.message);
        navigate('/signin');
      } catch (error) {
        setMessage(error.response?.data?.error || 'Failed to delete profile');
      }
    }
  };

  const handleViewPerformance = (token) => {
    navigate(`/teacher/question-history/${token}`);
  };

  if (!profile) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">User Profile</h2>
          {!isEditing ? (
            <>
              <p className="mb-2"><strong>Username:</strong> {profile.username}</p>
              <p className="mb-2"><strong>Email:</strong> {profile.email}</p>
              <p className="mb-2"><strong>Real Name:</strong> {profile.realName}</p>
              <p className="mb-4"><strong>Role:</strong> {profile.role}</p>
              {role === 'teacher' && profile.conductedTests.length > 0 && (
                <div>
                  <h4 className="mt-4 font-medium">Conducted Tests</h4>
                  {profile.conductedTests.map((test, index) => (
                    <div key={index} className="mb-2 p-2 border rounded">
                      <p>
                        <strong>Token:</strong> {test.token}, <strong>Subject:</strong> {test.subject || 'General'},
                        <strong> Date:</strong> {new Date(test.createdAt).toLocaleString()},
                        <strong> MCQs:</strong> {test.numMCQs}, <strong> Descriptive:</strong> {test.numDescriptive}
                        <button
                          onClick={() => handleViewPerformance(test.token)}
                          className="ml-2 bg-blue-500 text-white px-2 py-1 rounded text-sm flex items-center space-x-1 hover:bg-blue-600"
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
                  <h4 className="mt-4 font-medium">Attended Tests</h4>
                  {profile.attendedTests.map((test, index) => (
                    <div key={index} className="mb-2 p-2 border rounded">
                      <p>
                        <strong>Token:</strong> {test.token},
                        <strong> Date:</strong> {new Date(test.submittedAt).toLocaleString()},
                        <strong> Score:</strong> {test.score}/{test.totalMarks}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex space-x-2 mt-4">
                <button onClick={() => setIsEditing(true)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center space-x-1">
                  <FaEdit />
                  <span>Edit Profile</span>
                </button>
                <button onClick={handleDeleteProfile} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center space-x-1">
                  <FaTrash />
                  <span>Delete Profile</span>
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleUpdateProfile}>
              <div className="mb-4">
                <label htmlFor="newRealName" className="block text-gray-700 mb-1">Real Name</label>
                <input
                  type="text"
                  id="newRealName"
                  value={newRealName}
                  onChange={(e) => setNewRealName(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="newEmail" className="block text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  id="newEmail"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-gray-700 mb-1">New Password (optional)</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-center space-x-4">
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center space-x-1">
                  <FaEdit />
                  <span>Save Changes</span>
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          )}
          {message && <p className={`text-center mt-4 ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}
          <button onClick={() => navigate('/')} className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;