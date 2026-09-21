import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getSession, verifySession } from './auth';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import History from './pages/History';

function PrivateRoute({ children }) {
  const [status, setStatus] = useState('checking'); // checking | ok | fail

  useEffect(() => {
    // If we already have a token + user in localStorage, let the user in
    // immediately, then confirm with the backend in the background.
    const cached = getSession();
    if (cached) {
      setStatus('ok');
      verifySession().then((user) => {
        if (!user) setStatus('fail');
      });
      return;
    }

    verifySession().then((user) => {
      setStatus(user ? 'ok' : 'fail');
    });
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Loading…
      </div>
    );
  }

  if (status === 'fail') {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicOnly({ children }) {
  return getSession() ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
      <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}