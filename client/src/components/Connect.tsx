import { useEffect } from "react";

export function Connect() {
   

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
    
        if (token) {
          localStorage.setItem('accessToken', token);
    
          // Optionally, remove the token from the URL (for cleaner URLs)
          window.history.replaceState({}, document.title, window.location.pathname);
    
       
        }
      }, []);

      const handleConnectGitHub = () => {
    
        window.location.href = 'https://workik-be.cyb3rnaut.com/auth/github';
      };
  return (
    <div className="flex items-center justify-center h-screen w-full">
        <div className="bg-slate-800 h-[250px] w-[250px] rounded-xl flex items-center justify-center">
      <button 
        onClick={handleConnectGitHub}
        className="mt-4 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
      > 
        Connect GitHub
      </button>
      </div>

    </div>
  )
}
