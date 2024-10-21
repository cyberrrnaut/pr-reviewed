import  { useState, useEffect } from 'react';

function App() {
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState('');
  const[webhookCreated,setWebhookCreated] = useState(false);
  // Handle GitHub authentication
  const handleConnectGitHub = () => {
    
    window.location.href = 'https://workik-be.cyb3rnaut.com/auth/github';
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
        const response = await fetch('https://workik-be.cyb3rnaut.com/create-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: storedToken, repo }),
        });
        const data = await response.text();
        console.log(data);
        setWebhookCreated(true);
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
      <header className="p-5  border flex flex-col items-center">
        <h1 className="text-2xl font-bold">Auto-Git</h1>
        {token ? (
          
          <>
          {webhookCreated?<>
          <div className='p-5  border flex flex-col items-center"'>
           Webhook deployed

          </div>
          </> :<><p className="mt-4 text-green-500">Yayy you're Authenticated! </p>
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
            </button></> }
            
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
