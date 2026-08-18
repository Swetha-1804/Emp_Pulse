import { useState, useRef, useEffect } from 'react';
import { HelpCircle, Search, MessageSquare, Ticket, PlayCircle, X, Paperclip, ChevronRight, CheckCircle } from 'lucide-react';
import axios from '../api/client';

const SupportModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('faq');

  // FAQ State
  const [faqAnswers, setFaqAnswers] = useState({});
  const [expandedFaq, setExpandedFaq] = useState(null);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: "Hello! I'm your platform support assistant. I can help you navigate Employee Pulse and resolve issues. How can I help today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Ticket State
  const [ticketCategory, setTicketCategory] = useState('Bug Report');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketStatus, setTicketStatus] = useState(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="support-modal-title">
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="support-modal-title" className="modal-title">
            <HelpCircle size={24} /> Support Center
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close Support">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="tabs-sidebar">
            <button 
              className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
              onClick={() => setActiveTab('faq')}
            >
              <Search size={18} /> Knowledge Base / FAQ
            </button>
            <button 
              className={`tab-btn ${activeTab === 'ai-support' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai-support')}
            >
              <MessageSquare size={18} /> AI Support Assistant
            </button>
            <button 
              className={`tab-btn ${activeTab === 'ticket' ? 'active' : ''}`}
              onClick={() => setActiveTab('ticket')}
            >
              <Ticket size={18} /> Submit a Ticket
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'faq' && (
              <div>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Interactive Knowledge Base</h3>
                <div className="input-group">
                  <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Search for help (e.g., How does AI Project Matching work?)" 
                      style={{ paddingLeft: '2.5rem' }} 
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                  {['How does AI Project Matching work?', 'How to export skill gap reports?', 'Managing team permissions'].map((q, idx) => (
                    <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <button 
                        className="menu-link" 
                        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', border: 'none', borderRadius: 0, backgroundColor: expandedFaq === q ? 'var(--surface-color)' : 'transparent' }}
                        onClick={async () => {
                          if (expandedFaq === q) {
                            setExpandedFaq(null);
                            return;
                          }
                          setExpandedFaq(q);
                          if (!faqAnswers[q]) {
                            try {
                              const res = await axios.post('/api/support/faq', { question: q });
                              setFaqAnswers(prev => ({ ...prev, [q]: res.data.answer }));
                            } catch (e) {
                              setFaqAnswers(prev => ({ ...prev, [q]: "Error fetching answer." }));
                            }
                          }
                        }}
                      >
                        {q} <ChevronRight size={16} style={{ transform: expandedFaq === q ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                      </button>
                      {expandedFaq === q && (
                        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', fontSize: '0.875rem' }}>
                          {faqAnswers[q] || "Loading answer..."}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'ai-support' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Instant AI Support Assistant</h3>
                <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', maxHeight: '400px' }}>
                  <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
                    {chatMessages.map((msg, i) => (
                      <div key={i} style={{ 
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'var(--surface-color)', 
                        color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                        padding: '0.75rem 1rem', 
                        borderRadius: msg.sender === 'user' ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0', 
                        maxWidth: '80%', 
                        border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)' 
                      }}>
                        {msg.text}
                      </div>
                    ))}
                    {isAiTyping && (
                      <div style={{ alignSelf: 'flex-start', backgroundColor: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '1rem 1rem 1rem 0', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        AI is typing...
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    {['How to reset password?', 'Export skill gap report'].map(sq => (
                      <button 
                        key={sq} 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '1rem' }}
                        onClick={() => {
                          setChatInput(sq);
                        }}
                      >
                        {sq}
                      </button>
                    ))}
                  </div>

                  <form style={{ display: 'flex', gap: '0.5rem' }} onSubmit={async (e) => {
                    e.preventDefault();
                    if (!chatInput.trim()) return;
                    const userMsg = chatInput;
                    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
                    setChatInput('');
                    setIsAiTyping(true);
                    try {
                      const res = await axios.post('/api/support/ai-chat', { message: userMsg });
                      setChatMessages(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
                    } catch(err) {
                      setChatMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I couldn't connect to the server." }]);
                    } finally {
                      setIsAiTyping(false);
                    }
                  }}>
                    <input type="text" className="input-field" placeholder="Describe your issue..." value={chatInput} onChange={e => setChatInput(e.target.value)} style={{ flex: 1 }} />
                    <button type="submit" className="btn btn-primary" disabled={isAiTyping}>Send</button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'ticket' && (
              <div>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Submit a Ticket</h3>
                {ticketStatus ? (
                  <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <CheckCircle size={48} className="text-success" style={{ margin: '0 auto 1rem' }} />
                    <h4>{ticketStatus}</h4>
                    <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => setTicketStatus(null)}>Submit Another Ticket</button>
                  </div>
                ) : (
                  <form onSubmit={async (e) => { 
                    e.preventDefault(); 
                    try {
                      const res = await axios.post('/api/support/ticket', { category: ticketCategory, description: ticketDesc });
                      setTicketStatus(res.data.message);
                      setTicketDesc('');
                    } catch (err) {
                      alert('Failed to submit ticket');
                    }
                  }}>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="input-field" value={ticketCategory} onChange={e => setTicketCategory(e.target.value)}>
                        <option>Bug Report</option>
                        <option>Feature Request</option>
                        <option>Data Discrepancy</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea className="input-field" rows="4" placeholder="Please describe the issue in detail..." value={ticketDesc} onChange={e => setTicketDesc(e.target.value)} required></textarea>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Attachments (Screenshots/Logs) <span style={{fontWeight: 'normal', color: 'var(--text-secondary)'}}>(Optional)</span></label>
                      <div style={{ border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <Paperclip size={24} style={{ marginBottom: '0.5rem' }} />
                        <p>Drag and drop files here or click to browse</p>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary">Submit Ticket</button>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportModal;
