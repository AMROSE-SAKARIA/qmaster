import { useState } from 'react';
import axios from 'axios';

function Teacher({ token }) {
  const [textContent, setTextContent] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [numMCQs, setNumMCQs] = useState(5);
  const [numDescriptive, setNumDescriptive] = useState(3);
  const [mcqMarks, setMcqMarks] = useState(2);
  const [descriptiveMarks, setDescriptiveMarks] = useState(10);
  const [message, setMessage] = useState('');
  const [tokenResult, setTokenResult] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    formData.append('textContent', textContent);
    formData.append('numMCQs', numMCQs);
    formData.append('numDescriptive', numDescriptive);
    formData.append('mcqMarks', mcqMarks);
    formData.append('descriptiveMarks', descriptiveMarks);

    try {
      const res = await axios.post('http://localhost:5000/upload-content', formData, {
        headers: { 'authorization': token, 'Content-Type': 'multipart/form-data' },
      });
      setMessage(`Questions generated with token: ${res.data.token}`);
      setTokenResult(res.data.token);
    } catch (error) {
      setMessage(`Upload failed: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleCreateTest = async () => {
    const selectedMCQs = Array(5).fill().map((_, i) => ({ id: i + 1 })); // Placeholder
    const selectedDescriptive = Array(10).fill().map((_, i) => ({ id: i + 11 })); // Placeholder
    try {
      const res = await axios.post('http://localhost:5000/teacher/create-test', {
        token: tokenResult,
        selectedMCQs,
        selectedDescriptive,
      }, { headers: { 'authorization': token } });
      setMessage(`Test created with token: ${res.data.testToken}`);
    } catch (error) {
      setMessage(`Test creation failed: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Teacher Dashboard</h2>
      <form onSubmit={handleUpload} className="space-y-4">
        <textarea
          placeholder="Enter text for MCQs (max 3000 words)"
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          maxLength={15000} // Approx 3000 words
          className="border p-2 w-full h-40"
        />
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setPdfFile(e.target.files[0])}
          className="border p-2"
        />
        <input
          type="number"
          value={numMCQs}
          onChange={(e) => setNumMCQs(e.target.value)}
          placeholder="Number of MCQs"
          className="border p-2 w-32"
        />
        <input
          type="number"
          value={numDescriptive}
          onChange={(e) => setNumDescriptive(e.target.value)}
          placeholder="Number of Descriptive"
          className="border p-2 w-32"
        />
        <input
          type="number"
          value={mcqMarks}
          onChange={(e) => setMcqMarks(e.target.value)}
          placeholder="MCQ Marks"
          className="border p-2 w-32"
        />
        <input
          type="number"
          value={descriptiveMarks}
          onChange={(e) => setDescriptiveMarks(e.target.value)}
          placeholder="Descriptive Marks"
          className="border p-2 w-32"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Upload & Generate</button>
      </form>
      {message && <p className="mt-4">{message}</p>}
      {tokenResult && (
        <button onClick={handleCreateTest} className="bg-green-500 text-white p-2 rounded mt-4">
          Create Test (5 MCQs, 10 Descriptive)
        </button>
      )}
    </div>
  );
}

export default Teacher;