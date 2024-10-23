

import Webhook from './components/Webhook';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Homepage from './components/Homepage';
import Navbar from './components/Navbar';
import Cicd from './components/Cicd';

function App() {

  return (
    <BrowserRouter>
     <Navbar /> 
      <Routes>

        <Route  path="/"
          element={
           <Homepage/>} />

<Route
          path="/webhook"
          element={
           <Webhook/>
          }
        /> 
         <Route
        path="/ci-cd"
        element={
         <Cicd/>
        }
      />
    
    </Routes>
    </BrowserRouter>
  );
}

export default App;
