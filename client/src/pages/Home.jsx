function Home() {
  return (
    <div className="container min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md text-center">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">Welcome to QMaster</h2>
        <p>A platform for creating and taking educational tests.</p>
        <div className="mt-4">
          <a href="/signin" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mr-2">Sign In</a>
          <a href="/signup" className="bg-green-500 text-white p-2 rounded hover:bg-green-600">Sign Up</a>
        </div>
      </div>
    </div>
  );
}

export default Home;