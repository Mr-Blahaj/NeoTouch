import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import PuzzleBoard from '../components/PuzzleBoard';
import ConfettiCelebration from '../components/ConfettiCelebration';
import { getScoreLabel } from '../engine/AdaptiveEngine';
import { motion, AnimatePresence } from 'framer-motion';

export default function PuzzlePlay() {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    currentPuzzle, selectedOption, isCorrect, showResult,
    selectOption, submitAnswer, answerOption, requestHint, nextPuzzle, startNewPuzzle,
    currentHint, hintsUsedThisPuzzle, profile, progress, sessionPuzzleCount,
    playerName, currentWorld, useAI, isGeneratingAI, toggleAI
  } = useGameStore();

  useEffect(() => {
    if (!currentPuzzle) startNewPuzzle();
  }, []);

  const scoreInfo = getScoreLabel(profile.cognitiveScore);

  if (!currentPuzzle && !isGeneratingAI) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🧩</div>
          <h3>Loading puzzle...</h3>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-4) var(--space-6)', position: 'relative' }}>
      {/* Confetti */}
      <ConfettiCelebration active={showResult === true && isCorrect === true} />

      {/* Top Bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 'var(--space-6)', position: 'relative', zIndex: 20,
        maxWidth: 800, margin: '0 auto var(--space-6)',
        flexWrap: 'wrap', gap: 'var(--space-3)',
      }}>
        <button className="btn btn--secondary" onClick={() => navigate('/worlds')} style={{ fontSize: 'var(--text-sm)' }}>
          Worlds
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <span className="quiet-meta">
            Play {sessionPuzzleCount + 1}
          </span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--glass-bg)', borderRadius: 'var(--radius-full)',
            padding: 'var(--space-1) var(--space-3)',
            border: '1px solid var(--glass-border)',
          }}>
            <span style={{ fontSize: '1rem' }}>{scoreInfo.emoji}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)', fontSize: 'var(--text-sm)' }}>
              {profile.cognitiveScore}
            </span>
          </div>
          <span className="quiet-meta">Shelf {progress.level}</span>

          <div className="settings-shell">
            <button
              className="btn btn--secondary"
              onClick={() => setSettingsOpen(open => !open)}
              aria-expanded={settingsOpen}
              style={{ fontSize: 'var(--text-sm)' }}
            >
              Settings
            </button>
            {settingsOpen && (
              <div className="settings-menu">
                <h4 style={{ marginBottom: 'var(--space-2)' }}>Settings</h4>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', marginBottom: 'var(--space-2)' }}>
                  Adult controls stay here so the play space remains quiet.
                </p>
                <div className="settings-row">
                  <div>
                    <strong>Local AI ideas</strong>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
                      Use Ollama-backed puzzle and hint generation.
                    </div>
                  </div>
                  <button className="toggle-pill" aria-checked={useAI} onClick={toggleAI}>
                    <span />
                  </button>
                </div>
                <div className="settings-row">
                  <button className="btn btn--secondary" onClick={() => navigate('/parent')} style={{ width: '100%' }}>
                    Parent Dashboard
                  </button>
                </div>
                <div className="settings-row">
                  <button className="btn btn--secondary" onClick={() => navigate('/teacher')} style={{ width: '100%' }}>
                    Teacher Mode
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Puzzle Board or Generating State */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {isGeneratingAI ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', 
                justifyContent: 'center', minHeight: 400, gap: 'var(--space-4)'
              }}
            >
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ fontSize: '3rem' }}
              >
                🤖
              </motion.div>
              <h3 style={{ color: 'var(--ink)' }}>Making a new play piece...</h3>
              <p style={{ color: 'var(--ink-muted)', fontSize: 'var(--text-sm)' }}>
                This might take a moment if the model is loading.
              </p>
            </motion.div>
          ) : currentPuzzle ? (
            <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <PuzzleBoard
                puzzle={currentPuzzle}
                selectedOption={selectedOption}
                isCorrect={isCorrect}
                showResult={showResult}
                onSelectOption={selectOption}
                onSubmit={submitAnswer}
                onAnswerOption={answerOption}
                onHint={requestHint}
                onNext={nextPuzzle}
                currentHint={currentHint}
                hintsUsed={hintsUsedThisPuzzle}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
