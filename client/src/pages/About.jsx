import React from 'react';
import { useNavigate } from 'react-router-dom';

function About() {
  const navigate = useNavigate();

  return (
    <div className="app">
      <div className="container">
        <div className="card">
          <h2>About QMaster</h2>
          <p>QMaster is a platform for teachers to create tests and for students to take them.</p>
          <button onClick={() => navigate('/')} className="bg-gray-500 text-white p-2 rounded">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default About;