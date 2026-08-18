import { useState } from 'react';
import { Sparkles, Send, User } from 'lucide-react';
import axios from 'axios';

const LearningInterest = () => {
  const [interest, setInterest] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [experts, setExperts] = useState([]);
  const [connectedExperts, setConnectedExperts] = useState(new Set());
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (interest.trim()) {
      try {
        const response = await axios.post('http://localhost:5000/api/learning', { interest });
        setExperts(response.data.experts);
        setConnectedExperts(new Set()); // reset connections on new search
      } catch (err) {
        console.error(err);
      }
      setSubmitted(true);
    }
  };

  const handleConnect = (expertName) => {
    setConnectedExperts(prev => {
      const newSet = new Set(prev);
      newSet.add(expertName);
      return newSet;
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>What do you want to learn?</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Language or Tool</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g., Python, Power BI..." 
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                required 
              />
              <button type="submit" className="btn btn-primary">
                <Send size={18} /> Post Interest
              </button>
            </div>
          </div>
        </form>
      </div>

      {submitted && (
        <div className="card animate-fade-in">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Sparkles className="text-primary" size={24} /> AI Suggested Experts
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Based on your interest in <strong>{interest}</strong>, AI has found the following verified experts in your organization to guide you:
          </p>
          
          <div className="grid grid-cols-2">
            {experts.map((expert, idx) => (
              <div key={idx} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} className="text-secondary" />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0 }}>{expert.name}</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>{expert.role}</p>
                  <span className="badge success" style={{ marginTop: '0.5rem' }}>Match: {expert.matched}</span>
                </div>
                <button 
                  className={`btn ${connectedExperts.has(expert.name) ? 'btn-primary' : 'btn-outline'}`} 
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', backgroundColor: connectedExperts.has(expert.name) ? 'var(--success)' : '', borderColor: connectedExperts.has(expert.name) ? 'var(--success)' : '' }}
                  onClick={() => handleConnect(expert.name)}
                  disabled={connectedExperts.has(expert.name)}
                >
                  {connectedExperts.has(expert.name) ? 'Request Sent ✓' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
};

export default LearningInterest;

