import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';
import axios from 'axios';

const SkillsOverview = () => {
  const [metrics, setMetrics] = useState({
    skillData: [],
    experienceData: [],
    verifiedCount: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/dashboard/metrics');
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
                <BarChart data={metrics.experienceData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} />
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
