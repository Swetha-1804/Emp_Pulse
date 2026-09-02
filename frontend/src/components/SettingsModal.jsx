import { useState, useEffect } from 'react';
import { Settings, User, Bell, Cpu, Shield, X, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/client';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/admin/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to completely remove this employee? This cannot be undone.')) return;
    try {
      await axios.delete(`/api/admin/delete-employee/${id}`);
      setEmployees(employees.filter(e => e.id !== id));
    } catch (err) {
      alert('Failed to delete employee: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Manage Employees</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {employees.map(emp => (
          <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500 }}>{emp.name}</p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{emp.email} • {emp.role}</p>
            </div>
            <button 
              onClick={() => handleDelete(emp.id)}
              className="btn btn-outline" 
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Remove Employee"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuth();
  const [resetStatus, setResetStatus] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setIsResetting(true);
    setResetStatus(null);
    try {
      const response = await axios.post('/api/auth/reset-password', { email: user.email });
      setResetStatus({ type: 'success', message: response.data.message });
    } catch (err) {
      setResetStatus({ type: 'error', message: 'Failed to send reset link.' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="settings-modal-title" className="modal-title">
            <Settings size={24} /> Settings
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close Settings">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="tabs-sidebar">
            <button 
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} /> Profile & Preferences
            </button>
            <button 
              className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={18} /> Notification Center
            </button>

            <button 
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Shield size={18} /> Security & Privacy
            </button>
            {(user?.role === 'manager' || user?.role === 'admin') && (
              <button 
                className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <User size={18} /> User Management
              </button>
            )}
          </div>

          <div className="tab-content">
            {activeTab === 'profile' && (
              <div>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Profile & Preferences</h3>
                <div className="form-group">
                  <label className="form-label">Display Name</label>
                  <input type="text" className="input-field" defaultValue={user?.name || 'John Doe'} />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input type="text" className="input-field" defaultValue={user?.role || 'Manager'} />
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Language</label>
                  <select className="input-field">
                    <option>English (US)</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Time Zone</label>
                  <select className="input-field">
                    <option>UTC-8 (Pacific Time)</option>
                    <option>UTC-5 (Eastern Time)</option>
                    <option>UTC+0 (GMT)</option>
                  </select>
                </div>
                <button className="btn btn-primary" onClick={() => alert('Saved')}>Save Changes</button>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Notification Center</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked /> Alerts for new project matches
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked /> Reminders to update my experience or certifications
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked /> Updates on my GitHub connection status
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked /> Notifications for new learning paths/tools
                  </label>
                </div>
              </div>
            )}



            {activeTab === 'security' && (
              <div>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Security & Privacy</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                  <button 
                    className="btn btn-outline" 
                    onClick={handleResetPassword}
                    disabled={isResetting}
                  >
                    {isResetting ? 'Sending...' : 'Reset Password'}
                  </button>
                  {resetStatus && (
                    <div style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: resetStatus.type === 'success' ? '#dcfce7' : '#fee2e2', color: resetStatus.type === 'success' ? '#166534' : '#991b1b', fontSize: '0.875rem' }}>
                      {resetStatus.message}
                    </div>
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 0', width: '100%' }}>
                    <input type="checkbox" /> Enable Two-Factor Authentication (2FA)
                  </label>
                  <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => alert('All other sessions terminated.')}>
                    Log out of all other sessions
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'users' && (user?.role === 'manager' || user?.role === 'admin') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Add New Employee</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    try {
                      await axios.post('/api/admin/add-employee', data);
                      alert('Employee added successfully!');
                      e.target.reset();
                      // Refresh the list by tricking state
                      setActiveTab(''); setTimeout(() => setActiveTab('users'), 0);
                    } catch (err) {
                      alert('Failed to add employee: ' + (err.response?.data?.error || err.message));
                    }
                  }}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input type="text" name="name" className="input-field" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input type="email" name="email" className="input-field" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Temporary Password</label>
                      <input type="password" name="password" className="input-field" required minLength="6" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select name="role" className="input-field" required>
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary">Create Employee Account</button>
                  </form>
                </div>
                <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />
                <EmployeeList />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
