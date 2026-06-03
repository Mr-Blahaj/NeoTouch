import React from 'react';
import { motion } from 'framer-motion';
import { Grid } from '../engine/types';

interface GridRendererProps {
  grid: Grid;
  cellSize?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  onCellClick?: (row: number, col: number) => void;
  highlightCells?: [number, number][];
  label?: string;
}

const CELL_SIZES = { sm: 28, md: 40, lg: 56, xl: 72 };

const ARC_COLORS = [
  '#111111', '#315C52', '#B96B5E', '#7E9E80', '#D6BB91',
  '#B9B2A8', '#B9828B', '#A99173', '#9DC8C3', '#6B604F',
];

export default function GridRenderer({
  grid, cellSize = 'md', interactive = false, onCellClick, highlightCells, label,
}: GridRendererProps) {
  const size = CELL_SIZES[cellSize];
  const isHighlighted = (r: number, c: number) =>
    highlightCells?.some(([hr, hc]) => hr === r && hc === c) ?? false;

  // Defensive check: AI might hallucinate invalid grids
  if (!grid || !Array.isArray(grid.cells)) {
    return <div style={{ color: '#EF4444' }}>Invalid Grid Data</div>;
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'inline-grid',
          gridTemplateColumns: `repeat(${grid.width}, ${size}px)`,
          gap: 2,
          background: 'var(--paper-warm)',
          borderRadius: 10,
          padding: 3,
          border: '2px solid var(--paper-line)',
        }}
      >
        {grid.cells.flatMap((row, r) =>
          Array.isArray(row) ? row.map((cell, c) => (
            <motion.div
              key={`${r}-${c}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (r * grid.width + c) * 0.02, duration: 0.2 }}
              onClick={() => interactive && onCellClick?.(r, c)}
              style={{
                width: size,
                height: size,
                borderRadius: size > 50 ? 8 : 4,
                background: ARC_COLORS[cell] || ARC_COLORS[0],
                cursor: interactive ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
                boxShadow: isHighlighted(r, c) ? '0 0 12px rgba(251,191,36,0.6)' : 'none',
                border: isHighlighted(r, c) ? '2px solid var(--ink)' : '1px solid rgba(17,17,17,0.08)',
              }}
              whileHover={interactive ? { scale: 1.1, filter: 'brightness(1.3)' } : {}}
            />
          )) : null
        )}
      </motion.div>
      {label && <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-display)' }}>{label}</span>}
    </div>
  );
}
