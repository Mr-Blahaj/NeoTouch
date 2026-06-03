import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { getUnlockedWorlds, WORLDS } from '../engine/RewardEngine';
import { getScoreLabel } from '../engine/AdaptiveEngine';
import { PuzzleCategory } from '../engine/types';
import { getCategoryLabel } from '../engine/PuzzleGenerator';

const WORLD_BGS: Record<string, string> = {
  'shape-forest': '#fffdfa',
  'pattern-mountains': '#f1ece3',
  'logic-laboratory': '#f8f4ed',
  'arc-galaxy': '#fff9f1',
};

export default function WorldSelect() {
  const navigate = useNavigate();
  const { profile, progress, setCurrentWorld, startNewPuzzle, playerName, selectedPuzzleGroups, setPuzzleGroups } = useGameStore();
  const unlockedWorlds = getUnlockedWorlds(profile.cognitiveScore);
  const scoreInfo = getScoreLabel(profile.cognitiveScore);

  const handleWorldClick = (worldId: string) => {
    const isUnlocked = unlockedWorlds.some(w => w.id === worldId);
    if (!isUnlocked) return;
    if (worldId === 'arc-galaxy') {
      setCurrentWorld(worldId);
      navigate('/studio');
      return;
    }
    setCurrentWorld(worldId);
    startNewPuzzle(worldId);
    navigate('/play');
  };

  const toggleGroup = (category: PuzzleCategory) => {
    const exists = selectedPuzzleGroups.includes(category);
    setPuzzleGroups(exists
      ? selectedPuzzleGroups.filter(item => item !== category)
      : [...selectedPuzzleGroups, category]
    );
  };

  const allGroups = Array.from(new Set(WORLDS.flatMap(world => world.categories)));

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-6)' }}>
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}
        >
          <div>
            <h2 style={{ marginBottom: 'var(--space-1)' }}>Home World</h2>
            <p style={{ color: 'var(--ink-muted)' }}>Hi {playerName || 'friend'}. Pick a place to play.</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
            <div className="glass-card glass-card--static" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: '1.3rem' }}>{scoreInfo.emoji}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-xl)', color: 'var(--ink)' }}>{profile.cognitiveScore}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>growth</div>
              </div>
            </div>
            <div className="streak" style={{ fontSize: 'var(--text-base)' }}>
              <span className="streak__flame">✦</span>
              <span>{profile.streakDays}</span>
            </div>
            <button className="btn btn--secondary" onClick={() => navigate('/profile')} style={{ fontSize: 'var(--text-sm)' }}>
              Settings
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="glass-card glass-card--static"
          style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-5)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
            <div>
              <h4 style={{ fontSize: 'var(--text-lg)' }}>Puzzle Groups</h4>
              <p style={{ color: 'var(--ink-muted)', fontSize: 'var(--text-sm)' }}>
                Pick the skills to play. Leave empty for a balanced mix.
              </p>
            </div>
            <button className="btn btn--secondary" onClick={() => setPuzzleGroups([])} style={{ fontSize: 'var(--text-sm)' }}>
              Balanced Mix
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {allGroups.map(category => {
              const active = selectedPuzzleGroups.includes(category);
              return (
                <button
                  key={category}
                  className={`btn ${active ? 'btn--primary' : 'btn--secondary'}`}
                  onClick={() => toggleGroup(category)}
                  style={{ minHeight: 42, padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' }}
                >
                  {getCategoryLabel(category)}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* XP & Level Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card glass-card--static"
          style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-8)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}
        >
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)' }}>Sticker shelf {progress.level}</span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="progress-bar">
              <div className="progress-bar__fill" style={{ width: `${(progress.totalXP % 100)}%` }} />
            </div>
          </div>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>{progress.totalXP} sparkles</span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>{progress.badges.length} stickers</span>
        </motion.div>

        {/* World Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
          {WORLDS.map((world, i) => {
            const isUnlocked = unlockedWorlds.some(w => w.id === world.id);
            return (
              <motion.div
                key={world.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                whileHover={isUnlocked ? { scale: 1.03, y: -6 } : {}}
                whileTap={isUnlocked ? { scale: 0.98 } : {}}
                onClick={() => handleWorldClick(world.id)}
                style={{
                  background: WORLD_BGS[world.id] || world.color,
                  borderRadius: 'var(--radius-2xl)',
                  padding: 'var(--space-8) var(--space-6)',
                  cursor: isUnlocked ? 'pointer' : 'not-allowed',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: isUnlocked ? 1 : 0.4,
                  filter: isUnlocked ? 'none' : 'grayscale(0.6)',
                  minHeight: 220,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  boxShadow: isUnlocked ? 'var(--paper-shadow-sm)' : 'none',
                  border: '1px solid var(--paper-line)',
                  transition: 'all 0.3s',
                }}
              >
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)', color: 'var(--ink)' }}>{world.emoji}</div>
                  <h3 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>{world.name}</h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', lineHeight: 1.5 }}>{world.description}</p>

                  {!isUnlocked && (
                    <div style={{
                      marginTop: 'var(--space-3)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--ink-muted)',
                      display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    }}>
                      Grows open later
                    </div>
                  )}

                  {isUnlocked && (
                    <div style={{
                      marginTop: 'var(--space-3)',
                      display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
                      background: 'var(--ink)',
                      color: 'white',
                      padding: 'var(--space-1) var(--space-3)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-sm)', fontWeight: 600,
                    }}>
                      Play
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
