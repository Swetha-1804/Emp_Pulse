import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [role, setRole] = useState('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return;
    
    try {
      await login(role, email, password);
      if (role === 'employee') {
        navigate('/employee');
      } else {
        navigate('/manager');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="card auth-card">
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Welcome to Employee Pulse</h2>
        
        <div className="toggle-group">
          <button 
            type="button"
            className={`toggle-btn ${role === 'employee' ? 'active' : ''}`}
            onClick={() => setRole('employee')}
          >
            Employee
          </button>
          <button 
            type="button"
            className={`toggle-btn ${role === 'manager' ? 'active' : ''}`}
            onClick={() => setRole('manager')}
          >
            Manager
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email Id</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && (
            <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Login as {role === 'employee' ? 'Employee' : 'Manager'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
