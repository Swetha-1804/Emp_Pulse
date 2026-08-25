import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'employee' ? '/employee' : '/manager'} replace />;
  }
  
  return children;
};

import { useState, useEffect } from 'react';
import axios from './api/client';
import { X, UserPlus, Check } from 'lucide-react';

const MentorshipPopup = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (user) {
      // Check for pending requests
      const fetchRequests = async () => {
        try {
          const response = await axios.get(`/api/mentorship/pending/${user.id}`);
          setRequests(response.data);
        } catch (err) {
          console.error('Failed to fetch mentorship requests', err);
        }
      };
      
      fetchRequests();
      // Poll every 30 seconds
      const interval = setInterval(fetchRequests, 30000);
      return () => clearInterval(interval);
    } else {
      setRequests([]);
    }
  }, [user]);

  const handleResponse = async (requestId, status) => {
    try {
      await axios.post('/api/mentorship/respond', { requestId, status });
      setRequests(prev => prev.filter(r => r.id !== requestId));
      alert(`Mentorship request ${status}!`);
    } catch (err) {
      console.error(err);
      alert('Failed to respond to request');
    }
  };

  if (requests.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {requests.map(req => (
        <div key={req.id} className="card animate-fade-in" style={{ padding: '1rem', width: '300px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '2px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UserPlus size={18} /> Mentorship Request</h4>
            <button onClick={() => setRequests(prev => prev.filter(r => r.id !== req.id))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
          </div>
          <p style={{ fontSize: '0.875rem', margin: '0 0 1rem 0' }}>
            <strong>{req.requesterName}</strong> wants to learn <strong>{req.skill}</strong> from you!
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" style={{ flex: 1, padding: '0.25rem', fontSize: '0.875rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem' }} onClick={() => handleResponse(req.id, 'accepted')}><Check size={14} /> Accept</button>
            <button className="btn btn-outline" style={{ flex: 1, padding: '0.25rem', fontSize: '0.875rem', borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => handleResponse(req.id, 'rejected')}>Decline</button>
          </div>
        </div>
      ))}
    </div>
  );
};

const AppContent = () => {
  return (
    <div className="app-container">
      <Navbar />
      <MentorshipPopup />
      <main className="main-content animate-fade-in">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset" element={<ResetPassword />} />
          <Route 
            path="/employee/*" 
            element={
              <ProtectedRoute allowedRole="employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manager/*" 
            element={
              <ProtectedRoute allowedRole="manager">
                <ManagerDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
