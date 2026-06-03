import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Puzzle } from '../engine/types';
import GridRenderer from './GridRenderer';
import ShapeRenderer from './ShapeRenderer';
import StarDisplay from './StarDisplay';
import { calculateStars } from '../engine/RewardEngine';
import { getCategoryLabel } from '../engine/PuzzleGenerator';

interface Props {
  puzzle: Puzzle;
  selectedOption: string | null;
  isCorrect: boolean | null;
  showResult: boolean;
  onSelectOption: (optionId: string) => void;
  onSubmit: () => void;
  onAnswerOption: (optionId: string) => void;
  onHint: () => void;
  onNext: () => void;
  currentHint: string | null;
  hintsUsed: number;
}

export default function PuzzleBoard({
  puzzle, selectedOption, isCorrect, showResult,
  onSelectOption, onSubmit, onAnswerOption, onHint, onNext, currentHint, hintsUsed,
}: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const lastPinchDistanceRef = useRef<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [traceProgress, setTraceProgress] = useState(0);
  const [tracePath, setTracePath] = useState<{ x: number; y: number }[]>([]);
  const [traceError, setTraceError] = useState(false);
  const [mazeScale, setMazeScale] = useState(1);
  const [grabbedOption, setGrabbedOption] = useState<string | null>(null);
  const [memoryReady, setMemoryReady] = useState(false);
  const isDragPuzzle = puzzle.interactionType === 'drag_drop';
  const isTracePuzzle = puzzle.interactionType === 'trace_maze';
  const isMemoryPuzzle = getCategoryLabel(puzzle.category) === 'Memory Lights';

  useEffect(() => {
    setTraceProgress(0);
    setTracePath([]);
    setTraceError(false);
    setGrabbedOption(null);
    if (isMemoryPuzzle) {
      setMemoryReady(false);
      const timer = window.setTimeout(() => setMemoryReady(true), 3000);
      return () => window.clearTimeout(timer);
    }
    setMemoryReady(true);
  }, [puzzle.id, isMemoryPuzzle]);

  const clampZoom = (value: number) => Math.min(1.8, Math.max(0.75, value));
  const getPinchDistance = () => {
    const points = Array.from(pointersRef.current.values());
    if (points.length < 2) return null;
    const [a, b] = points;
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    setZoom(current => clampZoom(current - event.deltaY * 0.0015));
  };

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
    lastPinchDistanceRef.current = getPinchDistance();
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    const viewport = viewportRef.current;
    const previous = pointersRef.current.get(event.pointerId);
    if (!viewport || !previous) return;

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size >= 2) {
      const distance = getPinchDistance();
      if (distance && lastPinchDistanceRef.current) {
        const delta = distance / lastPinchDistanceRef.current;
        setZoom(current => clampZoom(current * delta));
      }
      lastPinchDistanceRef.current = distance;
      return;
    }

    viewport.scrollLeft -= (event.clientX - previous.x);
    viewport.scrollTop -= (event.clientY - previous.y);
  };

  const handlePointerEnd: React.PointerEventHandler<HTMLDivElement> = (event) => {
    pointersRef.current.delete(event.pointerId);
    lastPinchDistanceRef.current = getPinchDistance();
  };

  const handleTraceMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!isTracePuzzle || showResult) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const grid = puzzle.grid;
    if (!grid) return;

    const col = Math.floor((x / rect.width) * grid.width);
    const row = Math.floor((y / rect.height) * grid.height);
    const cell = grid.cells[row]?.[col];

    if (cell == null) return;
    if (cell === 5) {
      setTraceError(true);
      setTracePath([]);
      setTraceProgress(0);
      window.setTimeout(() => setTraceError(false), 500);
      return;
    }

    setTracePath(current => [...current.slice(-140), { x: (x / rect.width) * 100, y: (y / rect.height) * 100 }]);
    setTraceProgress(current => Math.max(current, (row + col) / Math.max(1, grid.width + grid.height - 2)));
    if (cell === 2) {
      window.setTimeout(() => {
        onAnswerOption(String(puzzle.correctAnswer));
      }, 120);
    }
  };

  const stars = showResult && isCorrect ? calculateStars({
    puzzleId: puzzle.id, category: puzzle.category, ageGroup: puzzle.ageGroup,
    difficulty: puzzle.difficulty, answer: selectedOption || '', correct: true,
    timeTakenMs: 10000, hintsUsed, retries: 0,
    timestamp: '', irtParameters: puzzle.irtParameters,
  }) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 800, margin: '0 auto', width: '100%' }}
    >
      {/* Category Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="badge badge--accent">{getCategoryLabel(puzzle.category).replace('ARC Rule Discovery', 'Pattern Play')}</span>
        <span className="quiet-meta">
          {isTracePuzzle ? 'Trace with your finger' : isDragPuzzle ? 'Grab and drop a choice' : 'Pinch to zoom · drag empty space to move'}
        </span>
      </div>

      {/* Instruction */}
      <motion.div
        className="glass-card glass-card--static"
        style={{ padding: 'var(--space-5)', textAlign: 'center' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
          {puzzle.instruction}
        </h3>
      </motion.div>

      {/* Hint Display */}
      <AnimatePresence>
        {currentHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'var(--paper-warm)',
              border: '1px solid var(--paper-line)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              textAlign: 'center',
              color: 'var(--ink)',
              fontSize: 'var(--text-base)',
            }}
          >
            Try this: {currentHint}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={viewportRef}
        className="play-viewport"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div className="play-canvas" style={{ transform: `scale(${zoom})` }}>
          {Array.isArray(puzzle.examplePairs) && puzzle.examplePairs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <span className="quiet-meta" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                Watch the pattern
              </span>
              <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', justifyContent: 'center' }}>
                {puzzle.examplePairs.map((pair, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}
                  >
                    <GridRenderer grid={pair.input} cellSize="sm" label={`Start ${i + 1}`} />
                    <span style={{ fontSize: '1.5rem', color: 'var(--ink)' }}>→</span>
                    <GridRenderer grid={pair.output} cellSize="sm" label={`Then ${i + 1}`} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {puzzle.testInput && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
              <span className="quiet-meta" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                What comes next?
              </span>
              <GridRenderer grid={puzzle.testInput} cellSize="md" />
            </div>
          )}

          {puzzle.grid && !puzzle.testInput && !puzzle.examplePairs && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-3)',
                justifyContent: 'center',
                position: 'relative',
                touchAction: isTracePuzzle ? 'none' : undefined,
              }}
            >
              {isTracePuzzle && (
                <label className="quiet-meta" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  Maze size
                  <input type="range" min={0.75} max={1.35} step={0.05} value={mazeScale} onChange={event => setMazeScale(Number(event.target.value))} />
                </label>
              )}
              <div
                onPointerDown={isTracePuzzle ? handleTraceMove : undefined}
                onPointerMove={isTracePuzzle ? handleTraceMove : undefined}
                style={{ position: 'relative', transform: isTracePuzzle ? `scale(${mazeScale})` : undefined, transformOrigin: 'center top', touchAction: isTracePuzzle ? 'none' : undefined }}
              >
                <GridRenderer grid={puzzle.grid} cellSize={isTracePuzzle ? 'md' : 'lg'} />
                {isTracePuzzle && (
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{
                      position: 'absolute',
                      inset: 5,
                      width: `calc(100% - 10px)`,
                      height: `calc(100% - 10px)`,
                      pointerEvents: 'none',
                      overflow: 'visible',
                    }}
                  >
                    <polyline
                      points={tracePath.map(point => `${point.x},${point.y}`).join(' ')}
                      fill="none"
                      stroke={traceError ? '#B96B5E' : '#315C52'}
                      strokeWidth={8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.9}
                    />
                  </svg>
                )}
              </div>
              {isTracePuzzle && (
                <span className="quiet-meta" style={{ color: traceError ? '#B96B5E' : 'var(--ink-muted)' }}>
                  {traceError ? 'Oops, stay inside the path.' : 'Start on green, trace through white, reach the home.'}
                </span>
              )}
            </div>
          )}

          {Array.isArray(puzzle.elements) && puzzle.elements.length > 0 && !puzzle.grid && (!isMemoryPuzzle || !memoryReady) && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)',
              justifyContent: 'center', padding: 'var(--space-4)',
              background: 'var(--paper-warm)', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--paper-line)',
            }}>
              {puzzle.elements.map((el, i) => (
                <ShapeRenderer key={i} element={el} size={56} />
              ))}
            </div>
          )}

          {isMemoryPuzzle && memoryReady && (
            <div className="glass-card glass-card--static" style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--ink-muted)', marginTop: 'var(--space-3)' }}>
              Now pick the order you saw.
            </div>
          )}

          {Array.isArray(puzzle.options) && puzzle.options.length > 0 && !isTracePuzzle && (!isMemoryPuzzle || memoryReady) && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))',
              gap: 'var(--space-3)',
              marginTop: 'var(--space-5)',
            }}>
              {puzzle.options.map((option, i) => {
                const isSelected = selectedOption === option.id;
                const isCorrectOpt = showResult && option.id === puzzle.correctAnswer;
                const isWrong = showResult && isSelected && !isCorrect;

                return (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    whileHover={!showResult ? { scale: 1.02 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                    onClick={() => !showResult && onSelectOption(option.id)}
                    onPointerDown={() => {
                      if (isDragPuzzle && !showResult) setGrabbedOption(option.id);
                    }}
                    draggable={isDragPuzzle && !showResult}
                    onDragStart={(event) => (event as unknown as React.DragEvent<HTMLButtonElement>).dataTransfer.setData('text/plain', option.id)}
                    className={`option-card ${isSelected && !showResult ? 'option-card--selected' : ''} ${isCorrectOpt ? 'option-card--correct' : ''} ${isWrong ? 'option-card--wrong' : ''}`}
                    style={{
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                      cursor: showResult ? 'default' : 'pointer',
                      minHeight: option.grid ? 'auto' : 72,
                      padding: option.grid ? 'var(--space-3)' : 'var(--space-4)',
                    }}
                  >
                    {option.grid && <GridRenderer grid={option.grid} cellSize="sm" />}
                    {Array.isArray(option.elements) && option.elements.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        {option.elements.map((el, elementIndex) => (
                          <ShapeRenderer key={elementIndex} element={el} size={38} />
                        ))}
                      </div>
                    )}
                    {option.label && (
                      <span style={{ fontSize: option.grid ? 'var(--text-xs)' : 'var(--text-base)', fontWeight: 500 }}>
                        {option.label}
                      </span>
                    )}
                    {!option.grid && !option.label && option.value != null && (
                      <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{String(option.value)}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
        {!showResult && (
          <>
            {isDragPuzzle && (
              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const optionId = event.dataTransfer.getData('text/plain');
                  if (optionId) onAnswerOption(optionId);
                }}
                onPointerUp={() => {
                  if (grabbedOption) onAnswerOption(grabbedOption);
                }}
                style={{
                  width: '100%',
                  minHeight: 86,
                  border: '2px dashed var(--paper-line)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ink-muted)',
                  background: 'var(--paper-warm)',
                  fontWeight: 700,
                }}
              >
                Drop the piece here
              </div>
            )}
            <button
              className="btn btn--secondary"
              onClick={onHint}
              disabled={hintsUsed >= 3}
              style={{ opacity: hintsUsed >= 3 ? 0.4 : 1 }}
            >
              Gentle Hint ({3 - hintsUsed})
            </button>
            <button
              className="btn btn--primary btn--lg"
              onClick={onSubmit}
              disabled={!selectedOption}
              style={{ opacity: selectedOption ? 1 : 0.4, minWidth: 160 }}
            >
              Try It
            </button>
          </>
        )}

        {showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', width: '100%' }}
          >
            {isCorrect ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  style={{ fontSize: 'var(--text-3xl)', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--color-secondary-600)' }}
                >
                  Lovely
                </motion.div>
                <StarDisplay stars={stars} size="lg" />
              </>
            ) : (
              <motion.div
                initial={{ x: -10 }}
                animate={{ x: 0 }}
                style={{ fontSize: 'var(--text-2xl)', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)' }}
              >
                Almost. Try another one.
              </motion.div>
            )}
            <button className="btn btn--accent btn--lg" onClick={onNext} style={{ minWidth: 200 }}>
              Next Play
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
