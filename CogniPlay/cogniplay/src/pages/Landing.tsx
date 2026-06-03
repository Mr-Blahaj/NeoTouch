import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';

export default function Landing() {
  const navigate = useNavigate();
  const { isSetup } = useGameStore();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)', position: 'relative', overflow: 'hidden' }}>
      {['○', '□', '△', '◇', '◐', '✦'].map((s, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -20, 0, 15, 0],
            x: [0, 10, -10, 5, 0],
            rotate: [0, 6, -6, 3, 0],
          }}
          transition={{ duration: 8 + i, repeat: Infinity, delay: i * 0.5 }}
          style={{
            position: 'absolute',
            fontSize: `${2 + i * 0.35}rem`,
            opacity: 0.08,
            top: `${10 + (i * 11) % 80}%`,
            left: `${5 + (i * 13) % 90}%`,
            pointerEvents: 'none',
          }}
        >
          {s}
        </motion.div>
      ))}

      {/* Hero Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: 600 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          style={{ fontSize: '4rem', marginBottom: 'var(--space-4)', color: 'var(--ink)' }}
        >
          ◼
        </motion.div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 900,
          marginBottom: 'var(--space-4)',
          lineHeight: 1.1,
        }}>
          <span className="text-gradient">CogniPlay</span>
        </h1>

        <p style={{
          fontSize: 'var(--text-xl)',
          color: '#94A3B8',
          marginBottom: 'var(--space-8)',
          lineHeight: 1.6,
        }}>
          A calm interactive play world for ages 3 to 5.
          <br />
          <span style={{ fontSize: 'var(--text-base)', color: 'var(--ink-muted)' }}>
            Touch, drag, trace, match, draw, and explore.
          </span>
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button
            className="btn btn--primary btn--xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(isSetup ? '/worlds' : '/age-select')}
            style={{ fontSize: 'var(--text-xl)', minWidth: 220 }}
          >
            {isSetup ? 'Continue Playing' : 'Enter Play World'}
          </motion.button>

          {isSetup && (
            <motion.button
              className="btn btn--secondary btn--lg"
              whileHover={{ scale: 1.03 }}
              onClick={() => navigate('/profile')}
            >
              Parent View
            </motion.button>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'flex', gap: 'var(--space-6)', justifyContent: 'center',
            marginTop: 'var(--space-10)', flexWrap: 'wrap',
          }}
        >
          {[
            { icon: '⌁', label: 'Trace Mazes', desc: 'Coordination' },
            { icon: '◆', label: 'Pattern Play', desc: 'Sequencing' },
            { icon: '✎', label: 'Drawing Studio', desc: 'Creativity' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="glass-card"
              style={{ padding: 'var(--space-4) var(--space-5)', textAlign: 'center', minWidth: 140 }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: 'var(--space-1)', color: 'var(--ink)' }}>{item.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>{item.label}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>{item.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
