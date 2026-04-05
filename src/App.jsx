import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar/Navbar';
import Loader from './components/Loader/Loader';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);

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
