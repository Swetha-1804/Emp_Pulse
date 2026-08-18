import { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Settings, HelpCircle, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SkillVerification from './SkillVerification';
import LearningInterest from './LearningInterest';
import SettingsModal from '../components/SettingsModal';
import SupportModal from '../components/SupportModal';

const EmployeeDashboard = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  return (
    <div className="manager-layout grid" style={{ gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'stretch' }}>
      <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* User Profile Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '0.5rem', padding: '0 0.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {user?.name || 'John Doe'}
          </h3>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
            {user?.role || 'Employee'}
          </span>
        </div>

        {/* Employee Menu Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Employee Menu</h3>
            <ChevronUp size={16} color="var(--text-secondary)" />
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link 
              to="/employee/skills" 
              className={`menu-link ${location.pathname.includes('/skills') ? 'active' : ''}`}
            >
              <CheckCircle size={18} />
              Skill Verification
            </Link>
            <Link 
              to="/employee/learning" 
              className={`menu-link ${location.pathname.includes('/learning') ? 'active' : ''}`}
            >
              <BookOpen size={18} />
              Tools to Learn
            </Link>
          </nav>
        </div>

        {/* Footer Links Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={() => setIsSettingsOpen(true)} 
              className="menu-link has-tooltip" 
              data-tooltip="Customize account preferences, notifications & AI options"
              style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
            >
              <Settings size={18} />
              Settings
            </button>
            <button 
              onClick={() => setIsSupportOpen(true)} 
              className="menu-link has-tooltip" 
              data-tooltip="Get help, view FAQs, or contact system admin"
              style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
            >
              <HelpCircle size={18} />
              Support
            </button>
          </nav>
        </div>
      </aside>
      
      <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Navigate to="skills" replace />} />
          <Route path="skills" element={<SkillVerification />} />
          <Route path="learning" element={<LearningInterest />} />
        </Routes>
      </div>

      {/* Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
};

export default EmployeeDashboard;
