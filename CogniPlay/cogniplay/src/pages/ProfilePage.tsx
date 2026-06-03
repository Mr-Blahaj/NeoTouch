import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { useGameStore } from '../stores/gameStore';
import { CognitiveDimension } from '../engine/types';
import { DIMENSION_LABELS, getStrengths, getGrowthAreas, generateInsights } from '../engine/CognitiveScorer';
import { getScoreLabel } from '../engine/AdaptiveEngine';
import { BADGES } from '../engine/RewardEngine';

const DIM_ICONS: Record<CognitiveDimension, string> = {
  [CognitiveDimension.PATTERN_RECOGNITION]: '🧬',
  [CognitiveDimension.SPATIAL_INTELLIGENCE]: '🌀',
  [CognitiveDimension.LOGICAL_REASONING]: '🧠',
  [CognitiveDimension.WORKING_MEMORY]: '💭',
  [CognitiveDimension.ATTENTION_CONTROL]: '🎯',
  [CognitiveDimension.PERSISTENCE]: '💪',
  [CognitiveDimension.LEARNING_SPEED]: '⚡',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, progress, playerName, history } = useGameStore();
  const scoreInfo = getScoreLabel(profile.cognitiveScore);
  const strengths = getStrengths(profile);
  const growth = getGrowthAreas(profile);
  const insights = generateInsights(profile);

  const radarData = Object.entries(profile.dimensions).map(([dim, score]) => ({
    dimension: DIMENSION_LABELS[dim as CognitiveDimension]?.replace(' ', '\n') || dim,
    score: Math.round(score / 10),
    fullMark: 100,
  }));

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-6)' }}>
      <div className="ambient-bg"><div className="ambient-bg__orb" /><div className="ambient-bg__orb" /><div className="ambient-bg__orb" /></div>

      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: 900 }}>
        <button className="btn btn--secondary" onClick={() => navigate('/worlds')} style={{ marginBottom: 'var(--space-6)' }}>← Back</button>
        <button className="btn btn--secondary" onClick={() => navigate('/age-select')} style={{ marginBottom: 'var(--space-6)', marginLeft: 'var(--space-3)' }}>Change Learner</button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-2)' }}>🧠</div>
          <h2>{playerName}'s Learning DNA</h2>
          <p style={{ color: '#94A3B8' }}>Your unique cognitive profile</p>
        </motion.div>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card glass-card--static"
          style={{ padding: 'var(--space-6)', textAlign: 'center', marginBottom: 'var(--space-6)' }}
        >
          <div style={{ fontSize: 'var(--text-6xl)', fontFamily: 'var(--font-display)', fontWeight: 900, color: scoreInfo.color }}>
            {profile.cognitiveScore}
          </div>
          <div style={{ fontSize: 'var(--text-xl)', fontFamily: 'var(--font-display)', fontWeight: 600, color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
            {scoreInfo.emoji} {scoreInfo.label}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-6)', justifyContent: 'center', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div><span style={{ fontWeight: 700, color: '#FBBF24' }}>⭐ {progress.level}</span><br /><span style={{ fontSize: 'var(--text-xs)', color: '#64748B' }}>Level</span></div>
            <div><span style={{ fontWeight: 700, color: '#F97316' }}>🔥 {profile.streakDays}</span><br /><span style={{ fontSize: 'var(--text-xs)', color: '#64748B' }}>Streak</span></div>
            <div><span style={{ fontWeight: 700, color: '#22C55E' }}>✅ {profile.totalPuzzlesSolved}</span><br /><span style={{ fontSize: 'var(--text-xs)', color: '#64748B' }}>Solved</span></div>
            <div><span style={{ fontWeight: 700, color: '#3B82F6' }}>💎 {progress.totalXP}</span><br /><span style={{ fontSize: 'var(--text-xs)', color: '#64748B' }}>Total XP</span></div>
          </div>
        </motion.div>

        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card glass-card--static"
          style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}
        >
          <h4 style={{ marginBottom: 'var(--space-4)', textAlign: 'center' }}>🧬 Cognitive Dimensions</h4>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData} cx="50%" cy="50%">
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Dimension Bars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card glass-card--static"
          style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}
        >
          <h4 style={{ marginBottom: 'var(--space-4)' }}>📊 Dimension Breakdown</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {Object.entries(profile.dimensions)
              .sort(([, a], [, b]) => b - a)
              .map(([dim, score], i) => {
                const pct = Math.round(score / 10);
                const isStrength = strengths.some(s => s.dimension === dim);
                const isGrowth = growth.some(g => g.dimension === dim);
                return (
                  <motion.div
                    key={dim}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                        {DIM_ICONS[dim as CognitiveDimension]} {DIMENSION_LABELS[dim as CognitiveDimension]}
                        {isStrength && <span className="badge badge--success" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>Strength</span>}
                        {isGrowth && <span className="badge badge--primary" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>Growing</span>}
                      </span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: pct >= 70 ? '#22C55E' : pct >= 40 ? '#F59E0B' : '#EF4444' }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="progress-bar" style={{ height: 6 }}>
                      <div className="progress-bar__fill" style={{
                        width: `${pct}%`,
                        background: pct >= 70 ? 'linear-gradient(90deg, #22C55E, #10B981)' : pct >= 40 ? 'linear-gradient(90deg, #F59E0B, #F97316)' : 'linear-gradient(90deg, #EF4444, #F97316)',
                      }} />
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>

        {/* Insights */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-card glass-card--static"
            style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}
          >
            <h4 style={{ marginBottom: 'var(--space-3)' }}>💡 Insights</h4>
            {insights.map((ins, i) => (
              <p key={i} style={{ color: '#CBD5E1', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>{ins}</p>
            ))}
          </motion.div>
        )}

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-card glass-card--static"
          style={{ padding: 'var(--space-6)' }}
        >
          <h4 style={{ marginBottom: 'var(--space-4)' }}>🏆 Achievements ({progress.badges.length}/{BADGES.length})</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
            {BADGES.map((badge) => {
              const earned = progress.badges.includes(badge.id);
              return (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.05 }}
                  title={badge.description}
                  style={{
                    textAlign: 'center', padding: 'var(--space-3)',
                    background: earned ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.02)',
                    borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${earned ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    opacity: earned ? 1 : 0.35,
                  }}
                >
                  <div style={{ fontSize: '2rem' }}>{badge.emoji}</div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: earned ? '#FBBF24' : '#64748B', marginTop: 'var(--space-1)' }}>{badge.name}</div>
                  <div className="achievement-hint" style={{
                    marginTop: 'var(--space-2)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--ink-muted)',
                    lineHeight: 1.35,
                  }}>
                    {badge.description}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
