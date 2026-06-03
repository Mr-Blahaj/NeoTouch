import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useGameStore } from '../stores/gameStore';
import { CognitiveDimension } from '../engine/types';
import { DIMENSION_LABELS, getStrengths, getGrowthAreas, generateInsights } from '../engine/CognitiveScorer';
import { getScoreLabel } from '../engine/AdaptiveEngine';
import { BADGES } from '../engine/RewardEngine';

// Friendly dimension names for parents
const FRIENDLY_NAMES: Record<CognitiveDimension, { name: string; desc: string; emoji: string }> = {
  [CognitiveDimension.PATTERN_RECOGNITION]: { name: 'Spotting Patterns', desc: 'Finding hidden rules and repeating sequences', emoji: '🧬' },
  [CognitiveDimension.SPATIAL_INTELLIGENCE]: { name: 'Shape Thinking', desc: 'Understanding how shapes move, rotate, and fit together', emoji: '🌀' },
  [CognitiveDimension.LOGICAL_REASONING]: { name: 'Smart Thinking', desc: 'Using clues to figure things out step by step', emoji: '🧠' },
  [CognitiveDimension.WORKING_MEMORY]: { name: 'Remembering & Juggling', desc: 'Keeping multiple things in mind at once', emoji: '💭' },
  [CognitiveDimension.ATTENTION_CONTROL]: { name: 'Focus Power', desc: 'Paying close attention to important details', emoji: '🎯' },
  [CognitiveDimension.PERSISTENCE]: { name: 'Never Give Up', desc: 'Trying again when things get tricky', emoji: '💪' },
  [CognitiveDimension.LEARNING_SPEED]: { name: 'Quick Learner', desc: 'How fast they pick up new ideas', emoji: '⚡' },
};

// Mock weekly data
const MOCK_WEEKLY = [
  { day: 'Mon', puzzles: 5, score: 480 },
  { day: 'Tue', puzzles: 8, score: 490 },
  { day: 'Wed', puzzles: 3, score: 495 },
  { day: 'Thu', puzzles: 12, score: 510 },
  { day: 'Fri', puzzles: 6, score: 505 },
  { day: 'Sat', puzzles: 15, score: 520 },
  { day: 'Sun', puzzles: 10, score: 530 },
];

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { profile, progress, playerName, history } = useGameStore();
  const scoreInfo = getScoreLabel(profile.cognitiveScore);
  const strengths = getStrengths(profile);
  const growth = getGrowthAreas(profile);
  const insights = generateInsights(profile);

  // Summary mood
  const mood = profile.cognitiveScore >= 600
    ? { emoji: '🌟', title: 'Fantastic!', subtitle: `${playerName || 'Your child'} is excelling!`, color: '#22C55E' }
    : profile.cognitiveScore >= 400
      ? { emoji: '📈', title: 'Great Progress!', subtitle: `${playerName || 'Your child'} is improving steadily!`, color: '#3B82F6' }
      : { emoji: '💪', title: 'Keep Going!', subtitle: `${playerName || 'Your child'} is building skills every day!`, color: '#F59E0B' };

  // Home activities based on growth areas
  const activities = growth.map(g => {
    const friendly = FRIENDLY_NAMES[g.dimension];
    switch (g.dimension) {
      case CognitiveDimension.PATTERN_RECOGNITION:
        return { emoji: '🎨', title: 'Pattern Hunt at Home', desc: 'Look for patterns in tiles, fabrics, and nature. Ask "What comes next?"' };
      case CognitiveDimension.SPATIAL_INTELLIGENCE:
        return { emoji: '🧱', title: 'Build & Construct', desc: 'Play with LEGO, origami, or jigsaw puzzles to strengthen spatial skills.' };
      case CognitiveDimension.LOGICAL_REASONING:
        return { emoji: '🎲', title: 'Board Game Night', desc: 'Play strategy games like Chess, Checkers, or Uno — great for logical thinking!' };
      case CognitiveDimension.WORKING_MEMORY:
        return { emoji: '🃏', title: 'Memory Card Game', desc: 'Play matching card games or "Simon Says" to boost working memory.' };
      case CognitiveDimension.ATTENTION_CONTROL:
        return { emoji: '🔍', title: 'Spot the Difference', desc: 'Use "Spot the Difference" books or apps to sharpen attention to detail.' };
      case CognitiveDimension.PERSISTENCE:
        return { emoji: '🧩', title: 'Challenging Puzzles', desc: 'Try a slightly harder puzzle together. Celebrate effort, not just the answer!' };
      default:
        return { emoji: '📚', title: 'Read Together', desc: 'Reading stories and discussing them builds all cognitive skills.' };
    }
  });

  // Add a bonus activity
  activities.push({ emoji: '🗣️', title: 'Talk About Puzzles', desc: 'Ask your child to explain HOW they solved a puzzle — this builds metacognition!' });

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-6)' }}>
      <div className="ambient-bg"><div className="ambient-bg__orb" /><div className="ambient-bg__orb" /><div className="ambient-bg__orb" /></div>

      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: 800 }}>
        <button className="btn btn--secondary" onClick={() => navigate('/')} style={{ marginBottom: 'var(--space-4)' }}>← Home</button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}
        >
          <h2>👨‍👩‍👦 Parent Dashboard</h2>
          <p style={{ color: '#94A3B8' }}>See how {playerName || 'your child'} is growing</p>
        </motion.div>

        {/* Big Mood Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: `linear-gradient(135deg, ${mood.color}15, ${mood.color}08)`,
            border: `2px solid ${mood.color}40`,
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--space-8)',
            textAlign: 'center',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-2)' }}>{mood.emoji}</div>
          <div style={{ fontSize: 'var(--text-3xl)', fontFamily: 'var(--font-display)', fontWeight: 900, color: mood.color }}>{mood.title}</div>
          <div style={{ fontSize: 'var(--text-lg)', color: '#CBD5E1', marginTop: 'var(--space-1)' }}>{mood.subtitle}</div>
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-6)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, color: mood.color }}>{profile.cognitiveScore}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#94A3B8' }}>Cognitive Score</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, color: '#F97316' }}>🔥 {profile.streakDays}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#94A3B8' }}>Day Streak</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, color: '#22C55E' }}>{profile.totalPuzzlesSolved}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#94A3B8' }}>Puzzles Solved</div>
            </div>
          </div>
        </motion.div>

        {/* Strengths */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card glass-card--static" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
          <h4 style={{ marginBottom: 'var(--space-4)' }}>🌟 Strengths</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {strengths.map((s, i) => {
              const friendly = FRIENDLY_NAMES[s.dimension];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'rgba(34,197,94,0.08)', borderRadius: 'var(--radius-lg)', borderLeft: '3px solid #22C55E' }}>
                  <span style={{ fontSize: '1.8rem' }}>{friendly.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{friendly.name}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: '#94A3B8' }}>{friendly.desc}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-xl)', color: '#22C55E' }}>{Math.round(s.score / 10)}%</div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Growth Areas */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card glass-card--static" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
          <h4 style={{ marginBottom: 'var(--space-4)' }}>🌱 Room to Grow</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {growth.map((g, i) => {
              const friendly = FRIENDLY_NAMES[g.dimension];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'rgba(59,130,246,0.08)', borderRadius: 'var(--radius-lg)', borderLeft: '3px solid #3B82F6' }}>
                  <span style={{ fontSize: '1.8rem' }}>{friendly.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{friendly.name}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: '#94A3B8' }}>{friendly.desc}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-xl)', color: '#3B82F6' }}>{Math.round(g.score / 10)}%</div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: '#94A3B8', marginTop: 'var(--space-3)', fontStyle: 'italic' }}>
            💡 These areas are getting stronger with every puzzle!
          </p>
        </motion.div>

        {/* Weekly Activity Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card glass-card--static" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
          <h4 style={{ marginBottom: 'var(--space-4)' }}>📅 This Week's Activity</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MOCK_WEEKLY}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, color: '#fff' }} />
              <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="puzzles" stroke="#22C55E" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', marginTop: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: '#8B5CF6' }}>━━ Score</span>
            <span style={{ fontSize: 'var(--text-xs)', color: '#22C55E' }}>╌╌ Puzzles solved</span>
          </div>
        </motion.div>

        {/* Achievement Gallery */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="glass-card glass-card--static" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
          <h4 style={{ marginBottom: 'var(--space-4)' }}>🏅 Achievements Earned</h4>
          {progress.badges.length === 0 ? (
            <p style={{ color: '#94A3B8', textAlign: 'center', padding: 'var(--space-4)' }}>
              Keep playing to earn badges! First one unlocks after 1 puzzle ✨
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              {BADGES.filter(b => progress.badges.includes(b.id)).map(badge => (
                <motion.div key={badge.id} whileHover={{ scale: 1.05 }} style={{
                  background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
                  borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-4)',
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{badge.emoji}</span>
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#FBBF24' }}>{badge.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: '#94A3B8' }}>{badge.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Try at Home */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="glass-card glass-card--static" style={{ padding: 'var(--space-5)' }}>
          <h4 style={{ marginBottom: 'var(--space-4)' }}>🏠 Try at Home</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
            {activities.map((act, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                style={{
                  background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
                  borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
                }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: 'var(--space-2)' }}>{act.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>{act.title}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: '#94A3B8', lineHeight: 1.5 }}>{act.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
