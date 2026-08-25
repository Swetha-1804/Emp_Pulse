import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import axios from '../api/client';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters.');
      return;
    }

    setStatus('loading');
    
    try {
      const response = await axios.post('/api/auth/update-password', {
        email,
        newPassword
      });
      
      setStatus('success');
      setMessage(response.data.message || 'Password updated successfully!');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Failed to update password. Please check your email.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-fade-in" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: 'var(--bg-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <KeyRound size={32} className="text-primary" />
            </div>
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Reset Password</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Enter your email and a new password below.</p>
        </div>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <CheckCircle size={48} className="text-success" style={{ margin: '0 auto 1rem auto' }} />
            <p style={{ color: 'var(--success)', fontWeight: 500, marginBottom: '1rem' }}>{message}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="email" 
                  className="input-field" 
                  style={{ paddingLeft: '2.75rem' }} 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  className="input-field" 
                  style={{ paddingLeft: '2.75rem' }} 
                  placeholder="Enter new password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  className="input-field" 
                  style={{ paddingLeft: '2.75rem' }} 
                  placeholder="Confirm new password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            {status === 'error' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <AlertCircle size={16} />
                <span>{message}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginBottom: '1rem' }}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Updating...' : 'Update Password'}
            </button>
            
            <div style={{ textAlign: 'center' }}>
              <button 
                type="button" 
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
