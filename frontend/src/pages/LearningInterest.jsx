import { useState } from 'react';
import { Sparkles, Send, User } from 'lucide-react';
import axios from '../api/client';
import { useAuth } from '../context/AuthContext';

const LearningInterest = () => {
  const [interest, setInterest] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [experts, setExperts] = useState([]);
  const [connectedExperts, setConnectedExperts] = useState(new Set());
  
  const { user } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (interest.trim()) {
      try {
        // Make the search smarter: extract known skills if they type a full sentence
        const availableSkills = ['python', 'sql', 'dbt', 'snowflake', 'azure', 'react', 'javascript', 'java'];
        const lowerInput = interest.toLowerCase();
        let extractedSkill = interest.trim().toLowerCase();
        
        for (const s of availableSkills) {
          if (lowerInput.includes(s)) {
            extractedSkill = s;
            break;
          }
        }

        const response = await axios.get(`/api/mentorship/experts/${extractedSkill}?userId=${user?.id}`);
        setExperts(response.data);
        setConnectedExperts(new Set()); // reset connections on new search
        
        // Optionally update the input field to show what was extracted
        if (extractedSkill !== lowerInput) {
           setInterest(extractedSkill);
        }
      } catch (err) {
        console.error(err);
      }
      setSubmitted(true);
    }
  };

  const handleConnect = async (expert) => {
    try {
      await axios.post('/api/mentorship/request', {
        requesterId: user?.id,
        expertId: expert.id,
        skill: interest.trim()
      });
      setConnectedExperts(prev => {
        const newSet = new Set(prev);
        newSet.add(expert.id);
        return newSet;
      });
    } catch (err) {
      console.error(err);
      alert('Failed to send connection request');
    }
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
          
          {experts.length > 0 ? (
            <div className="grid grid-cols-2">
              {experts.map((expert) => (
                <div key={expert.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={20} className="text-secondary" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0 }}>{expert.name}</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>{expert.role}</p>
                    <span className="badge success" style={{ marginTop: '0.5rem' }}>Expert Verified</span>
                  </div>
                  <button 
                    className={`btn ${connectedExperts.has(expert.id) ? 'btn-primary' : 'btn-outline'}`} 
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', backgroundColor: connectedExperts.has(expert.id) ? 'var(--success)' : '', borderColor: connectedExperts.has(expert.id) ? 'var(--success)' : '' }}
                    onClick={() => handleConnect(expert)}
                    disabled={connectedExperts.has(expert.id)}
                  >
                    {connectedExperts.has(expert.id) ? 'Request Sent ✓' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--warning)', padding: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-md)' }}>
              No verified experts found for "{interest}" in the organization yet.
            </p>
          )}
        </div>
      )}
      
    </div>
  );
};

export default LearningInterest;

