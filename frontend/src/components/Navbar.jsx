import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <img src="/sys_logo.png" alt="Systech Logo" className="nav-logo" />
        <span>Employee Pulse</span>
      </Link>
      
      <div className="nav-links">
        {user && (
          <>
            <span style={{ fontWeight: 500 }}>
              {user.role}
            </span>
            <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500, fontSize: '0.9375rem', padding: 0 }}>
              <LogOut size={18} />
              Logout
            </button>
          </>
        )}
        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Navbar;
