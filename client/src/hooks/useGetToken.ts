import { useState, useEffect } from 'react';

export const useGetToken = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    
    if (storedToken) {
      setToken(storedToken); 
    } else {
      setToken(null); 
    }
  }, []);

  return token; 
};
