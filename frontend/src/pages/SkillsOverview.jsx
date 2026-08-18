import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';
import axios from '../api/client';

const SkillsOverview = () => {
  const [metrics, setMetrics] = useState({
    skillData: [],
    experienceData: [],
    verifiedCount: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get('/api/dashboard/metrics');
        setMetrics(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetrics();
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Activity size={24} /> Organizational Skills Dashboard
        </h2>
        
        <div className="grid grid-cols-2" style={{ alignItems: 'start' }}>
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Skill Distribution</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.skillData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {metrics.skillData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Experience Levels</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.experienceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.9}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)'}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255, 255, 255, 0.05)'}} 
                    contentStyle={{backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#colorCount)" 
                    radius={[6, 6, 0, 0]} 
                    animationDuration={1500} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="card" style={{ borderTop: '4px solid var(--success)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Verified Employees</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{metrics.verifiedCount}</p>
          <p style={{ color: 'var(--success)', margin: 0 }}>+12 this month</p>
        </div>
        <div className="card" style={{ borderTop: '4px solid var(--warning)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Top Learning Interest</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>dbt</p>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>24 employees requested training</p>
        </div>
      </div>
    </div>
  );
};

export default SkillsOverview;
