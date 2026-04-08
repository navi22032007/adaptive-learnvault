import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar/Navbar';
import Loader from './components/Loader/Loader';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import { useStore } from './store';

function AppRoutes() {
  const location = useLocation();
  const token = useStore(state => state.token);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={token ? <Dashboard /> : <Navigate to="/login" />} 
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const { fetchAllData, token } = useStore();

  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token, fetchAllData]);

  return (
    <BrowserRouter>
      <div className="noise">
        {!loaded && <Loader onComplete={() => setLoaded(true)} />}
        {loaded && (
          <>
            <Navbar />
            <AppRoutes />
          </>
        )}
      </div>
    </BrowserRouter>
  );
}
