import { useEffect, useState } from 'react';
import { Connect } from './Connect';
import { useGetToken } from '../hooks/useGetToken';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import axios from 'axios';
import { useGetUsername } from '../hooks/useGetUsername';

export default function Webhook() {
  const [repo, setRepo] = useState('');
  const [repos, setRepos] = useState<string[]>([]); // To store repositories
  const [webhookCreated, setWebhookCreated] = useState(false);  
  const [token, setToken] = useState<string | null>(null);

  const storedToken = useGetToken();
  const { username } = useGetUsername(); // Use the custom hook

  useEffect(() => {
    setToken(storedToken);
  }, [storedToken]);

  // Handle OAuth callback
  const handleCallback = () => {
    const tokenFromUrl = new URLSearchParams(window.location.search).get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      localStorage.setItem('accessToken', tokenFromUrl);  // Save token for later
    }
  };

  // Fetch user repositories from GitHub
  const fetchRepos = async () => {
    const storedToken = localStorage.getItem('accessToken') || token;
  
    if (storedToken) {
      try {
        const response = await axios.get('https://api.github.com/user/repos', {
          headers: {
            Authorization: `token ${storedToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        const repoNames = response.data.map((repo: any) => repo.name);
        setRepos(repoNames);
      } catch (error) {
        console.error('Error fetching repositories:', error);
      }
    }
  };

  // Create Webhook using the stored token
  const createWebhook = async () => {
    const storedToken = localStorage.getItem('accessToken') || token;
    
    if (repo && storedToken && username) { 
      try {
        const fullRepoName = `${username}/${repo}`; 
        const response = await axios.post(
          'https://workik-be.cyb3rnaut.com/create-webhook',
          { token: storedToken, repo: fullRepoName },   
          { headers: { 'Content-Type': 'application/json' } }
        );
  
        const data = response.data; // axios automatically parses JSON
        console.log(data);
        setWebhookCreated(true); // Update state after successful response
      } catch (error) {
        console.error('Error creating webhook:', error);
      }
    }
  };

  // On mount, check for token in URL and fetch repos
  useEffect(() => {
    handleCallback();
    if (token) {
      fetchRepos();
    }
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white">
      {token !== null ? (
        <>
          {webhookCreated ? (
            <>
              <div className='p-5 rounded-xl text-green-500  bg-slate-900 flex flex-col items-center"'>
               Congrats  Webhook deployed for {repo}!
              </div>
            </>
          ) : (
            <>
              <div className='bg-slate-900 h-[35px] w-[300px] flex items-center justify-center cursor-pointer  rounded '>
                <DropdownMenu>
                  <DropdownMenuTrigger>{repo || 'Select your repository'}</DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-900 text-white border-none max-h-48 overflow-y-auto scrollbar-hide">
                    {repos.map((repoName) => (
                      <DropdownMenuItem
                        key={repoName}
                        onClick={() => setRepo(repoName)}
                        className="hover:bg-slate-700"
                      >
                        {repoName}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <button
                onClick={createWebhook}
                className="mt-4 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
              >
                Create Webhook
              </button>
            </>
          )}
        </>
      ) : (
        <Connect />
      )}
    </div>
  );
}
