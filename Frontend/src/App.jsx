import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Loader from './components/Loader/Loader';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ContentViewer from './components/Dashboard/ContentViewer';
import { useStore } from './store';

function AppRoutes() {
  const token = useStore(state => state.token);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route 
        path="/dashboard" 
        element={token ? <Dashboard /> : <Navigate to="/login" />} 
      />
    </Routes>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const { selectedContent } = useStore();

  return (
    <BrowserRouter>
      <div className="noise">
        {!loaded && <Loader onComplete={() => setLoaded(true)} />}
        {loaded && (
          <>
            <Navbar />
            <AppRoutes />
            {selectedContent && <ContentViewer />}
          </>
        )}
      </div>
    </BrowserRouter>
  );
}
