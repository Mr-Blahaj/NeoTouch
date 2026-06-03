import React from 'react';
import { motion } from 'framer-motion';

interface Props { stars: number; maxStars?: number; size?: 'sm' | 'md' | 'lg'; }

const SIZES = { sm: '1.2rem', md: '2rem', lg: '3rem' };

export default function StarDisplay({ stars, maxStars = 3, size = 'md' }: Props) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {Array.from({ length: maxStars }, (_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.2, type: 'spring', stiffness: 300, damping: 15 }}
          style={{
            fontSize: SIZES[size],
            color: i < stars ? '#FBBF24' : 'rgba(255,255,255,0.15)',
            filter: i < stars ? 'drop-shadow(0 0 8px rgba(251,191,36,0.5))' : 'none',
            display: 'inline-block',
          }}
        >
          ★
        </motion.span>
      ))}
    </div>
  );
}
