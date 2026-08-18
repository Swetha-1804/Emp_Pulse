import { useState } from 'react';
import { Bot, Send, Lightbulb, Paperclip } from 'lucide-react';
import axios from 'axios';

const OrgInsights = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! Ask me anything about current projects, skill gaps, or upskilling recommendations for the organization.' }
  ]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const handleSubmit = async (e, text = query) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    const userQuery = text;
    setMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setQuery('');
    setShowSuggestions(false);

    try {
      const response = await axios.post('/api/ai/insights', { query: userQuery });
      setMessages(prev => [...prev, { sender: 'ai', text: response.data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I couldn't process that request right now." }]);
    }
  };

  const handleSuggestionClick = (text) => {
    handleSubmit(null, text);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '600px', padding: '1.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>
          <Bot size={24} color="var(--text-primary)" /> Organization Insights AI Dashboard
        </h2>
        
        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', paddingRight: '0.5rem' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.sender === 'user' ? '#eef2ff' : 'var(--bg-color)',
              color: msg.sender === 'user' ? '#312e81' : 'var(--text-primary)',
              padding: '0.75rem 1rem',
              borderRadius: msg.sender === 'user' ? '1.5rem 1.5rem 0 1.5rem' : '1.5rem 1.5rem 1.5rem 0',
              maxWidth: '80%',
              border: '1px solid var(--border-color)',
              fontSize: '0.9375rem',
              lineHeight: '1.5'
            }}>
              {msg.sender === 'ai' && <Lightbulb size={16} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--warning)' }} />}
              {msg.text}
            </div>
          ))}
          
          {/* Quick Suggestions */}
          {showSuggestions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'flex-end', alignItems: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => handleSuggestionClick("How many employees are currently working at Systech?")} className="suggestion-pill">
                How many employees are currently working at Systech?
              </button>
              <button onClick={() => handleSuggestionClick("What are the most common skills verified in our organization?")} className="suggestion-pill">
                What are the most common skills verified in our organization?
              </button>
              <button onClick={() => handleSuggestionClick("Can you provide a summary of the current learning interests across teams?")} className="suggestion-pill">
                Can you provide a summary of the current learning interests across teams?
              </button>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={(e) => handleSubmit(e)} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.25rem' }}>
          <input 
            type="text" 
            placeholder="e.g., What are the current projects in our organization?" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', padding: '0.75rem', backgroundColor: 'transparent', color: 'var(--text-primary)' }}
          />
          <button type="button" style={{ background: 'transparent', border: 'none', padding: '0.5rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paperclip size={20} />
          </button>
          <button type="submit" style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} disabled={!query.trim()}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrgInsights;

