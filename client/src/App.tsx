import React, { useState, useEffect } from 'react';

function App() {
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState('');

  // Handle GitHub authentication
  const handleConnectGitHub = () => {
    
    window.location.href = 'http://workik-be.cyb3rnaut.com/auth/github';
  };

  // Handle OAuth callback
  const handleCallback = () => {
    const tokenFromUrl = new URLSearchParams(window.location.search).get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      localStorage.setItem('github_token', tokenFromUrl);  // Save token for later
    }
  };

  // Create Webhook using the stored token
  const createWebhook = async () => {
    const storedToken = localStorage.getItem('github_token') || token;
    if (repo && storedToken) {
      try {
        const response = await fetch('http://localhost:3000/create-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: storedToken, repo }),
        });
        const data = await response.text();
        console.log(data);
      } catch (error) {
        console.error('Error creating webhook:', error);
      }
    }
  };

  // On mount, check for token in URL
  useEffect(() => {
    handleCallback();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <header className="p-5">
        <h1 className="text-2xl font-bold">Auto GitHub PR Reviewer</h1>
        {token ? (
          <>
            <p className="mt-4">Authenticated! Access Token: {token}</p>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="Enter your repository (e.g., username/repo)"
              className="mt-4 p-2 bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={createWebhook}
              className="mt-4 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Create Webhook
            </button>
          </>
        ) : (
          <button 
            onClick={handleConnectGitHub}
            className="mt-4 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Connect GitHub
          </button>
        )}
      </header>
    </div>
  );
}

export default App;
