// apps/web/src/App.jsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import Alerts    from './pages/Alerts';
import Billing   from './pages/Billing';
import Login     from './pages/Login';

function TokenHandler() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);
  return null;
}

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <TokenHandler />
      <Routes>
        <Route path="/login"     element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/campaigns" element={<PrivateRoute><Campaigns /></PrivateRoute>} />
        <Route path="/alerts"    element={<PrivateRoute><Alerts /></PrivateRoute>} />
        <Route path="/billing"   element={<PrivateRoute><Billing /></PrivateRoute>} />
        <Route path="*"          element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}