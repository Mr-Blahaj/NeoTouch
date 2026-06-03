import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { CognitiveDimension } from '../engine/types';
import { DIMENSION_LABELS } from '../engine/CognitiveScorer';

// Mock classroom data
const MOCK_STUDENTS = [
  { name: 'Aarav', score: 720, trend: 'up', dims: { pr: 82, si: 65, lr: 78, wm: 70, ac: 55, pe: 88, ls: 72 } },
  { name: 'Ananya', score: 680, trend: 'up', dims: { pr: 75, si: 72, lr: 68, wm: 80, ac: 62, pe: 65, ls: 78 } },
  { name: 'Arjun', score: 550, trend: 'down', dims: { pr: 60, si: 55, lr: 52, wm: 48, ac: 65, pe: 45, ls: 55 } },
  { name: 'Diya', score: 810, trend: 'up', dims: { pr: 88, si: 82, lr: 85, wm: 78, ac: 72, pe: 90, ls: 85 } },
  { name: 'Ishaan', score: 430, trend: 'flat', dims: { pr: 42, si: 50, lr: 40, wm: 38, ac: 45, pe: 35, ls: 42 } },
  { name: 'Kavya', score: 630, trend: 'up', dims: { pr: 65, si: 70, lr: 62, wm: 58, ac: 68, pe: 55, ls: 65 } },
  { name: 'Manav', score: 740, trend: 'up', dims: { pr: 78, si: 75, lr: 80, wm: 72, ac: 70, pe: 68, ls: 76 } },
  { name: 'Nisha', score: 380, trend: 'down', dims: { pr: 35, si: 42, lr: 38, wm: 30, ac: 40, pe: 28, ls: 35 } },
  { name: 'Priya', score: 590, trend: 'flat', dims: { pr: 58, si: 62, lr: 55, wm: 60, ac: 50, pe: 52, ls: 58 } },
  { name: 'Rohan', score: 670, trend: 'up', dims: { pr: 72, si: 68, lr: 65, wm: 70, ac: 58, pe: 60, ls: 68 } },
  { name: 'Saanvi', score: 760, trend: 'up', dims: { pr: 80, si: 78, lr: 82, wm: 74, ac: 68, pe: 72, ls: 78 } },
  { name: 'Vihaan', score: 490, trend: 'flat', dims: { pr: 50, si: 48, lr: 45, wm: 52, ac: 42, pe: 40, ls: 48 } },
];

const DIM_KEYS = ['pr', 'si', 'lr', 'wm', 'ac', 'pe', 'ls'] as const;
const DIM_FULL = ['Pattern Recognition', 'Spatial Intelligence', 'Logical Reasoning', 'Working Memory', 'Attention Control', 'Persistence', 'Learning Speed'];

function getDimColor(val: number): string {
  if (val >= 70) return '#22C55E';
  if (val >= 50) return '#F59E0B';
  return '#EF4444';
}

function getTrendEmoji(t: string) { return t === 'up' ? '📈' : t === 'down' ? '📉' : '➡️'; }

export default function TeacherDashboard() {
  const navigate = useNavigate();

  // Averages per dimension
  const avgData = DIM_KEYS.map((key, i) => ({
    dimension: DIM_FULL[i].replace(' ', '\n'),
    avg: Math.round(MOCK_STUDENTS.reduce((s, st) => s + st.dims[key], 0) / MOCK_STUDENTS.length),
    fullMark: 100,
  }));

  // Score distribution
  const bins = [
    { range: '0-200', count: MOCK_STUDENTS.filter(s => s.score < 200).length, color: '#EF4444' },
    { range: '200-400', count: MOCK_STUDENTS.filter(s => s.score >= 200 && s.score < 400).length, color: '#F97316' },
    { range: '400-600', count: MOCK_STUDENTS.filter(s => s.score >= 400 && s.score < 600).length, color: '#F59E0B' },
    { range: '600-800', count: MOCK_STUDENTS.filter(s => s.score >= 600 && s.score < 800).length, color: '#3B82F6' },
    { range: '800-1000', count: MOCK_STUDENTS.filter(s => s.score >= 800).length, color: '#8B5CF6' },
  ];

  // Alerts
  const alerts = MOCK_STUDENTS.filter(s => s.score < 450 || s.trend === 'down');
  const avgScore = Math.round(MOCK_STUDENTS.reduce((s, st) => s + st.score, 0) / MOCK_STUDENTS.length);

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-6)' }}>
      <div className="ambient-bg"><div className="ambient-bg__orb" /><div className="ambient-bg__orb" /><div className="ambient-bg__orb" /></div>

      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: 1100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <button className="btn btn--secondary" onClick={() => navigate('/')} style={{ marginBottom: 'var(--space-2)' }}>← Home</button>
            <h2>👩‍🏫 Teacher Dashboard</h2>
            <p style={{ color: '#94A3B8' }}>Classroom cognitive analytics</p>
          </div>
          <div className="glass-card glass-card--static" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-3xl)', fontFamily: 'var(--font-display)', fontWeight: 900, color: '#3B82F6' }}>{avgScore}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: '#94A3B8' }}>Class Average</div>
            <div style={{ fontSize: 'var(--text-sm)', color: '#22C55E', fontWeight: 600 }}>{MOCK_STUDENTS.length} students</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
          {/* Radar */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card glass-card--static" style={{ padding: 'var(--space-5)' }}>
            <h4 style={{ marginBottom: 'var(--space-3)' }}>🧬 Class Cognitive Profile</h4>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={avgData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="avg" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Score Distribution */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card glass-card--static" style={{ padding: 'var(--space-5)' }}>
            <h4 style={{ marginBottom: 'var(--space-3)' }}>📊 Score Distribution</h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bins}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {bins.map((b, i) => <Cell key={i} fill={b.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Cognitive Heatmap */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card glass-card--static" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-6)', overflowX: 'auto' }}>
          <h4 style={{ marginBottom: 'var(--space-4)' }}>🔥 Cognitive Heatmap</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 'var(--space-2)', color: '#94A3B8', fontSize: 'var(--text-xs)', fontWeight: 600 }}>Student</th>
                <th style={{ padding: 'var(--space-2)', color: '#94A3B8', fontSize: 'var(--text-xs)', fontWeight: 600 }}>Score</th>
                {DIM_FULL.map(d => <th key={d} style={{ padding: 'var(--space-2)', color: '#94A3B8', fontSize: 'var(--text-xs)', fontWeight: 600, maxWidth: 70 }}>{d.split(' ')[0]}</th>)}
                <th style={{ padding: 'var(--space-2)', color: '#94A3B8', fontSize: 'var(--text-xs)' }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_STUDENTS.sort((a, b) => b.score - a.score).map((st) => (
                <tr key={st.name} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: 'var(--space-2)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>{st.name}</td>
                  <td style={{ padding: 'var(--space-2)', textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>{st.score}</td>
                  {DIM_KEYS.map(k => (
                    <td key={k} style={{ padding: 'var(--space-1)', textAlign: 'center' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: getDimColor(st.dims[k]) + '20', color: getDimColor(st.dims[k]),
                        fontSize: 'var(--text-xs)', fontWeight: 700,
                      }}>
                        {st.dims[k]}
                      </div>
                    </td>
                  ))}
                  <td style={{ padding: 'var(--space-2)', textAlign: 'center', fontSize: '1.2rem' }}>{getTrendEmoji(st.trend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card glass-card--static" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
            <h4 style={{ marginBottom: 'var(--space-4)', color: '#F59E0B' }}>⚠️ Students Needing Attention</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
              {alerts.map(st => (
                <div key={st.name} style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 'var(--space-1)' }}>{st.name} {getTrendEmoji(st.trend)}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: '#94A3B8' }}>Score: <b style={{ color: getDimColor(st.score / 10) }}>{st.score}</b></div>
                  <div style={{ fontSize: 'var(--text-xs)', color: '#EF4444', marginTop: 'var(--space-1)' }}>
                    {st.trend === 'down' ? 'Score declining — check engagement' : 'Below average — consider guided practice'}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recommended Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="glass-card glass-card--static" style={{ padding: 'var(--space-5)' }}>
          <h4 style={{ marginBottom: 'var(--space-4)' }}>💡 Recommended Actions</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[
              { icon: '🎯', text: 'Focus Nisha and Ishaan on Pattern Completion — their weakest area.', color: '#EF4444' },
              { icon: '🏆', text: 'Challenge Diya with ARC Rule Discovery puzzles — she is ready for advanced reasoning.', color: '#22C55E' },
              { icon: '📐', text: 'Class-wide Spatial Intelligence is lowest — try group Shape Transformation activities.', color: '#F59E0B' },
              { icon: '🔄', text: 'Arjun is trending down — schedule a 1-on-1 practice session this week.', color: '#3B82F6' },
            ].map((action, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: action.color + '10', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${action.color}` }}>
                <span style={{ fontSize: '1.5rem' }}>{action.icon}</span>
                <span style={{ fontSize: 'var(--text-sm)', color: '#CBD5E1' }}>{action.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
