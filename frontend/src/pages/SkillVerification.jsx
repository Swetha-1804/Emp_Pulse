import { useState, useEffect } from 'react';
import { GitBranch, CheckCircle, UploadCloud, Star, Award, Code, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const SkillVerification = () => {
  const { user } = useAuth();
  const [experienceType, setExperienceType] = useState('fresher');
  const [years, setYears] = useState('');
  
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubStats, setGithubStats] = useState(null);

  const [score, setScore] = useState(0);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [verifiedSkillsList, setVerifiedSkillsList] = useState([]);
  
  const allAvailableSkills = ['python', 'sql', 'dbt', 'snowflake', 'azure'];

  const [assessmentModal, setAssessmentModal] = useState(false);
  const [assessmentLanguage, setAssessmentLanguage] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [assessmentStatus, setAssessmentStatus] = useState('idle'); // idle, loading, active, grading, completed
  const [assessmentScore, setAssessmentScore] = useState(0);
  const [confidence, setConfidence] = useState('Low');
  const [certFile, setCertFile] = useState(null);
  const [certBoost, setCertBoost] = useState(0);

  // Calculate dynamic score based on ALL verified skills or just the selected one
  useEffect(() => {
    let currentSessionScore = 0;
    
    // Only give points for actual verification (GitHub + Assessment)
    if (githubConnected && githubStats) {
      currentSessionScore += Math.min(50, githubStats.score); // up to 50
    }
    if (assessmentScore > 0) {
      currentSessionScore += Math.min(50, (assessmentScore / 100) * 50); // up to 50
    }
    
    let finalScore = 0;

    if (selectedSkill) {
      // If a specific skill is selected, ONLY show the score for that skill session
      finalScore = Math.min(100, Math.round(currentSessionScore + certBoost));
    } else {
      // Average score across all verified skills
      const completedScores = verifiedSkillsList.map(s => s.score);
      if (completedScores.length > 0) {
        let avg = completedScores.reduce((a, b) => a + b, 0) / completedScores.length;
        finalScore = Math.min(100, Math.round(avg + certBoost));
      } else {
        finalScore = Math.min(100, Math.round(certBoost));
      }
    }
    
    setScore(finalScore);
    
    if (finalScore <= 40) setConfidence('Low');
    else if (finalScore <= 75) setConfidence('Medium');
    else setConfidence('High');
    
  }, [selectedSkill, experienceType, years, githubConnected, githubStats, assessmentScore, verifiedSkillsList, certBoost]);

  const handleSkillToggle = (skill) => {
    // Reset session data when switching skills
    setSelectedSkill(skill);
    setGithubConnected(false);
    setGithubStats(null);
    setAssessmentScore(0);
    setAssessmentStatus('idle');
  };

  const handleSaveVerifiedSkill = async () => {
    if (!selectedSkill) return;
    
    // Save to backend
    try {
      await axios.post('/api/skills/verify', {
        userId: user?.id || 1,
        skillName: selectedSkill,
        experienceType,
        years: years || null
      });
      
      // Calculate local score for this specific skill (only verification)
      let currentSessionScore = 0;
      if (githubConnected && githubStats) currentSessionScore += Math.min(50, githubStats.score);
      if (assessmentScore > 0) currentSessionScore += Math.min(50, (assessmentScore / 100) * 50);
      
      const newScore = Math.min(100, Math.round(currentSessionScore));
      let newConf = newScore <= 40 ? 'Low' : newScore <= 75 ? 'Medium' : 'High';
      
      setVerifiedSkillsList(prev => {
        const filtered = prev.filter(s => s.name !== selectedSkill);
        return [...filtered, { name: selectedSkill, score: newScore, confidence: newConf }];
      });
      
      alert(`Successfully saved verification for ${selectedSkill.toUpperCase()}!`);
      
      // Reset for next skill
      setSelectedSkill('');
      setGithubConnected(false);
      setGithubStats(null);
      setAssessmentScore(0);
      setAssessmentStatus('idle');
      setCertFile(null);
      
    } catch (err) {
      console.error(err);
      alert('Failed to save skill verification.');
    }
  };

  const handleConnectGithub = async (e) => {
    e.preventDefault();
    if (!githubUsername || !selectedSkill) {
      alert("Please enter username and ensure a skill is selected first.");
      return;
    }
    try {
      const response = await axios.post('/api/github/real-verify', {
        username: githubUsername,
        token: githubToken,
        selectedSkill
      });
      setGithubStats(response.data.data);
      setGithubConnected(true);
    } catch (error) {
      console.error(error);
      alert('GitHub verification failed. Check the username or token.');
    }
  };

  const openAssessment = async (lang) => {
    setAssessmentLanguage(lang);
    setAssessmentStatus('loading');
    setAssessmentModal(true);
    try {
      const response = await axios.post('/api/assessment/generate', { language: lang });
      setQuestions(response.data.questions);
      setAssessmentStatus('active');
    } catch (err) {
      console.error(err);
      setAssessmentModal(false);
    }
  };

  const submitAssessment = async () => {
    setAssessmentStatus('grading');
    try {
      const response = await axios.post('/api/assessment/submit', { answers, language: assessmentLanguage });
      setAssessmentScore(response.data.score);
      setAssessmentStatus('completed');
    } catch (err) {
      console.error(err);
      setAssessmentStatus('active');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      
      {/* Score Dashboard */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--primary)', color: 'white' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Award size={28} /> {selectedSkill ? `${selectedSkill.charAt(0).toUpperCase() + selectedSkill.slice(1)} Verification Score` : 'Overall Verification Score'}
          </h2>
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
            Increase your score by passing AI assessments and connecting GitHub!
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>{score}%</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
              <span>Confidence:</span> 
              <span style={{ 
                color: confidence === 'High' ? '#4ade80' : confidence === 'Medium' ? '#facc15' : '#f87171'
              }}>{confidence}</span>
            </div>
          </div>
          <div style={{ width: '200px', height: '8px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '4px', marginTop: '0.5rem' }}>
            <div style={{ width: `${score}%`, height: '100%', backgroundColor: 'white', borderRadius: '4px', transition: 'width 0.5s ease-out' }}></div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Star className="text-primary" size={24} /> Skill Verification
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Select ONE skill at a time to verify. Complete the assessment and GitHub check, then save.</p>
        
        {verifiedSkillsList.length > 0 && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Previously Verified Skills</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {verifiedSkillsList.map(vs => (
                <span key={vs.name} style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--success)', color: 'white', borderRadius: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle size={14} /> {vs.name.toUpperCase()} (Score: {vs.score}, {vs.confidence})
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {allAvailableSkills.map((skill) => (
            <div key={skill} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: selectedSkill === skill ? 'rgba(59,130,246,0.05)' : 'transparent', opacity: (selectedSkill && selectedSkill !== skill) ? 0.5 : 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500, flex: 1 }}>
                <input 
                  type="radio" 
                  name="skill_selection"
                  checked={selectedSkill === skill} 
                  onChange={() => handleSkillToggle(skill)} 
                  style={{ width: '18px', height: '18px' }}
                />
                {skill.charAt(0).toUpperCase() + skill.slice(1)}
              </label>
              {selectedSkill === skill && (
                <button className="btn btn-outline" onClick={() => openAssessment(skill)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                  <Code size={16} /> Take AI Assessment
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <GitBranch size={24} /> GitHub Verification
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Connect your GitHub to calculate a score based on your actual commits, PRs, and repos.</p>
        
        {!githubConnected ? (
          <form onSubmit={handleConnectGithub}>
            <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">GitHub Username (Required)</label>
                <input type="text" className="input-field" placeholder="e.g., octocat" value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} required />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">API Token (Optional)</label>
                <input type="password" className="input-field" placeholder="ghp_..." value={githubToken} onChange={(e) => setGithubToken(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Connect & Analyze</button>
          </form>
        ) : (
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', border: `1px solid ${githubStats?.confidence === 'Low' ? 'var(--error)' : 'var(--success)'}`, borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: githubStats?.confidence === 'Low' ? 'var(--error)' : 'var(--success)', margin: 0 }}>
                {githubStats?.confidence === 'Low' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                GitHub Analysis Complete
              </h3>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{githubStats?.score}%</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Level: {githubStats?.level}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Metrics</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <li>Repos Analyzed: <strong>{githubStats?.repositoriesAnalyzed || 0}</strong></li>
                  <li>Commits: <strong>{githubStats?.commitsAnalyzed || 0}</strong></li>
                  <li>PRs (Total): <strong>{githubStats?.pullRequests || 0}</strong></li>
                  <li>PRs (Merged): <strong>{githubStats?.mergedPRs || 0}</strong></li>
                </ul>
              </div>
              
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Repo Breakdown</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {(githubStats?.repositoryBreakdown || []).map(r => (
                    <li key={r.repository} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{r.repository}</span>
                      <strong>{r.score}%</strong>
                    </li>
                  ))}
                  {(!githubStats?.repositoryBreakdown || githubStats.repositoryBreakdown.length === 0) && (
                    <li style={{ color: 'var(--text-secondary)' }}>No repos with matching structures found.</li>
                  )}
                </ul>
              </div>
            </div>

            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Technology Evidence Found</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {(githubStats?.evidence || []).map((e, i) => {
                const isError = e.includes('No explicit developer contribution');
                return (
                  <span key={i} style={{ padding: '0.2rem 0.6rem', backgroundColor: isError ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', color: isError ? 'var(--error)' : 'var(--primary)', borderRadius: '1rem', fontSize: '0.8rem' }}>
                    {isError ? '✗' : '✓'} {e}
                  </span>
                );
              })}
              {(!githubStats?.evidence || githubStats.evidence.length === 0) && (
                <span style={{ fontSize: '0.85rem', color: 'var(--error)' }}>No strong structural evidence found for {selectedSkill}.</span>
              )}
            </div>

            {githubStats?.repositoriesAnalyzed === 0 && githubStats?.discoveredRepos && (
              <>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '1rem', marginBottom: '0.5rem' }}>Debug: Repositories Found on GitHub</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {githubStats.discoveredRepos.length === 0 ? 
                    "GitHub API returned 0 repositories. If this is an organization repo, check SAML SSO token authorization." : 
                    githubStats.discoveredRepos.join(', ')}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Experience Details</h2>
          <div className="toggle-group">
            <button type="button" className={`toggle-btn ${experienceType === 'fresher' ? 'active' : ''}`} onClick={() => setExperienceType('fresher')}>Fresher</button>
            <button type="button" className={`toggle-btn ${experienceType === 'experienced' ? 'active' : ''}`} onClick={() => setExperienceType('experienced')}>Experienced</button>
          </div>
          {experienceType === 'experienced' && (
            <div className="input-group animate-fade-in">
              <label className="input-label">Years of Experience</label>
              <input type="number" className="input-field" placeholder="e.g., 3" min="1" value={years} onChange={(e) => setYears(e.target.value)} />
            </div>
          )}
        </div>
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><UploadCloud size={24} /> Boost & Save</h2>
          <div className="input-group">
            <label className="input-label">Optional: Upload Certification Proof (+5 Score)</label>
            <input type="file" className="input-field" accept=".pdf,.png,.jpg" onChange={(e) => setCertFile(e.target.files[0])} />
          </div>
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', opacity: certFile ? 1 : 0.5, cursor: certFile ? 'pointer' : 'not-allowed', marginBottom: '1.5rem' }} 
            onClick={() => {
              if (certFile) {
                setCertBoost(prev => prev + 5);
                setCertFile(null);
                alert('Certificate uploaded! +5 Score Boost applied.');
              }
            }}
            disabled={!certFile}
          >
            Upload Certificate
          </button>
          
          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '1rem 0' }}></div>
          
          <button 
            className="btn btn-primary" 
            style={{ width: '100%' }} 
            onClick={handleSaveVerifiedSkill}
            disabled={!selectedSkill}
          >
            Save {selectedSkill ? selectedSkill.toUpperCase() : 'Skill'} Verification
          </button>
        </div>
      </div>

      {/* AI Assessment Modal */}
      {assessmentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', margin: '2rem' }}>
            <button onClick={() => setAssessmentModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={24} />
            </button>
            
            <h2 style={{ marginBottom: '1rem' }}>AI Assessment: {assessmentLanguage.toUpperCase()}</h2>
            
            {assessmentStatus === 'loading' && <p>Generating questions using AI...</p>}
            
            {assessmentStatus === 'active' && (
              <div>
                {questions.map((q, idx) => (
                  <div key={q.id} style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{idx + 1}. {q.text}</p>
                    {q.type === 'mcq' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {q.options.map(opt => (
                          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="radio" name={`q_${q.id}`} onChange={() => setAnswers(prev => ({...prev, [q.id]: opt}))} />
                            {opt}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea className="input-field" rows="4" placeholder="Write your code here..." onChange={(e) => setAnswers(prev => ({...prev, [q.id]: e.target.value}))}></textarea>
                    )}
                  </div>
                ))}
                <button className="btn btn-primary" onClick={submitAssessment} style={{ width: '100%' }}>Submit for AI Grading</button>
              </div>
            )}

            {assessmentStatus === 'grading' && <p>AI is grading your answers...</p>}

            {assessmentStatus === 'completed' && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <CheckCircle size={48} className="text-success" style={{ margin: '0 auto 1rem auto' }} />
                <h3>Assessment Complete!</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)', margin: '1rem 0' }}>{assessmentScore}%</p>
                <p style={{ color: 'var(--text-secondary)' }}>Your score has been verified and added to your profile.</p>
                <button className="btn btn-outline" onClick={() => setAssessmentModal(false)} style={{ marginTop: '1rem' }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default SkillVerification;

