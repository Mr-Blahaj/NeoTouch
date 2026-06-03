import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';

export default function AgeSelection() {
  const navigate = useNavigate();
  const { setPlayerInfo, switchPlayer, players } = useGameStore();
  const [name, setName] = useState('');
  const savedPlayers = Object.keys(players);

  const handleStart = () => {
    if (!name.trim()) return;
    setPlayerInfo(name.trim());
    navigate('/worlds');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card glass-card--static"
        style={{ maxWidth: 680, width: '100%', padding: 'var(--space-8)', textAlign: 'center' }}
      >
        <h2 style={{ marginBottom: 'var(--space-2)' }}>Choose Learner</h2>
        <p style={{ color: 'var(--ink-muted)', marginBottom: 'var(--space-6)' }}>
          CogniPlay is built only for ages 3 to 5.
        </p>

        {savedPlayers.length > 0 && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
            {savedPlayers.map(player => (
              <button
                key={player}
                className="btn btn--secondary"
                onClick={() => {
                  switchPlayer(player);
                  navigate('/worlds');
                }}
              >
                {player}
              </button>
            ))}
          </div>
        )}

        <input
          type="text"
          placeholder="New learner name..."
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={20}
          style={{
            width: '100%',
            maxWidth: 420,
            padding: 'var(--space-4) var(--space-5)',
            background: 'var(--paper)',
            border: '2px solid var(--paper-line)',
            borderRadius: 'var(--radius-xl)',
            color: 'var(--ink)',
            fontSize: 'var(--text-xl)',
            fontFamily: 'var(--font-display)',
            outline: 'none',
            textAlign: 'center',
            marginBottom: 'var(--space-5)',
          }}
        />

        <div>
          <button
            className="btn btn--primary btn--xl"
            onClick={handleStart}
            disabled={!name.trim()}
            style={{ opacity: name.trim() ? 1 : 0.4, minWidth: 240 }}
          >
            Start Play
          </button>
        </div>
      </motion.div>
    </div>
  );
}
