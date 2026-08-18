import { useState } from 'react';
import { Search, Users, Sparkles } from 'lucide-react';
import axios from 'axios';

const ProjectMatching = () => {
  const [requirements, setRequirements] = useState('');
  const [searched, setSearched] = useState(false);
  const [matches, setMatches] = useState([]);

  const [allocated, setAllocated] = useState({});

  const handleSearch = async (e) => {
    e.preventDefault();
    if (requirements.trim()) {
      try {
        const response = await axios.post('/api/ai/match-project', { requirements });
        setMatches(response.data.matches);
        setAllocated({}); // Reset allocation state on new search
      } catch (err) {
        console.error(err);
      }
      setSearched(true);
    }
  };

  const handleAllocate = (idx) => {
    setAllocated(prev => ({...prev, [idx]: true}));
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Users size={24} /> Project Resource Matching
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Input your project requirements (e.g., "2 SQL developers and 3 Python developers") to get AI-driven matches based on verified employee skills.
        </p>

        <form onSubmit={handleSearch}>
          <div className="input-group">
            <textarea 
              className="input-field" 
              rows="3"
              placeholder="Describe your resource needs..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              required
            ></textarea>
          </div>
          <button type="submit" className="btn btn-primary">
            <Search size={18} /> Find Matches
          </button>
        </form>
      </div>

      {searched && (
        <div className="card animate-fade-in">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Sparkles className="text-primary" size={24} /> AI Recommended Team
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {matches.map((match, idx) => (
              <div key={idx} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{match.name} <span className="badge success" style={{ marginLeft: '0.5rem' }}>{match.match} Match</span></h4>
                  <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0' }}>{match.role} • {match.experience} • <strong style={{color: 'var(--primary)'}}>Level: {match.skillLevel}</strong></p>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}><strong>Verified Skills:</strong> {match.verifiedSkills}</p>
                </div>
                <button 
                  className={`btn ${allocated[idx] ? 'btn-success' : 'btn-outline'}`}
                  onClick={() => handleAllocate(idx)}
                  disabled={allocated[idx]}
                >
                  {allocated[idx] ? 'Allocated ✓' : 'Request Allocation'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMatching;

