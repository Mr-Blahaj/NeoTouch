import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

const COLORS = ['#3B82F6', '#EF4444', '#22C55E', '#EAB308', '#F472B6', '#F97316', '#67E8F9', '#8B5CF6', '#FBBF24'];

interface Props {
  active: boolean;
  onComplete?: () => void;
}

export default function ConfettiCelebration({ active, onComplete }: Props) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (active) {
      const newPieces: ConfettiPiece[] = Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.5,
      }));
      setPieces(newPieces);
      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setPieces([]);
    }
  }, [active]);

  return (
    <AnimatePresence>
      {pieces.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 600, overflow: 'hidden' }}>
          {pieces.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0, scale: 1 }}
              animate={{
                y: '110vh',
                rotate: p.rotation + 720,
                x: `${p.x + (Math.random() - 0.5) * 30}vw`,
                opacity: [1, 1, 1, 0],
                scale: [1, 1.2, 0.8, 0.5],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 + Math.random(), delay: p.delay, ease: 'easeIn' }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size * 0.6,
                background: p.color,
                borderRadius: 2,
                top: -10,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
