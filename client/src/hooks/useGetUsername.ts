import { useState, useEffect } from 'react';
import axios from 'axios';

export const useGetUsername = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsername = async () => {
      const storedToken = localStorage.getItem('accessToken');
      if (!storedToken) return;

      try {
        const userResponse = await axios.get('https://api.github.com/user', {
          headers: {
            Authorization: `token ${storedToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        setUsername(userResponse.data.login);
      } catch (error) {
        setError('Error fetching username');
        console.error(error);
      }
    };

    fetchUsername();
  }, []);

  return { username, error };
};
