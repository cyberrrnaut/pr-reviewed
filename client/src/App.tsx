import React, { useState, useEffect } from 'react';

function App() {
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState('');

  // Handle GitHub authentication
  const handleConnectGitHub = () => {
    window.location.href = 'http://localhost:3000/auth/github';
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
    <div className="App">
      <header className="App-header">
        <h1>Auto GitHub PR Reviewer</h1>
        {token ? (
          <>
            <p>Authenticated! Access Token: {token}</p>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="Enter your repository (e.g., username/repo)"
            />
            <button onClick={createWebhook}>Create Webhook</button>
          </>
        ) : (
          <button onClick={handleConnectGitHub}>Connect GitHub</button>
        )}
      </header>
    </div>
  );
}

export default App;

