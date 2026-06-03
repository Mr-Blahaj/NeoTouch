import React from 'react';
import { motion } from 'framer-motion';
import { PuzzleElement } from '../engine/types';

const ARC_COLORS = [
  '#111111', '#315C52', '#B96B5E', '#7E9E80', '#D6BB91',
  '#B9B2A8', '#B9828B', '#A99173', '#9DC8C3', '#6B604F',
];

interface Props {
  element: PuzzleElement;
  size?: number;
  showHighlight?: boolean;
}

function getShapePath(type: string, s: number): string {
  const h = s / 2;
  switch (type) {
    case 'circle': return ''; // use <circle>
    case 'square': return `M ${h * 0.3} ${h * 0.3} L ${h * 1.7} ${h * 0.3} L ${h * 1.7} ${h * 1.7} L ${h * 0.3} ${h * 1.7} Z`;
    case 'triangle': return `M ${h} ${h * 0.2} L ${h * 1.8} ${h * 1.8} L ${h * 0.2} ${h * 1.8} Z`;
    case 'star': {
      const cx = h, cy = h, outerR = h * 0.85, innerR = h * 0.35;
      let path = '';
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 72 - 90) * Math.PI / 180;
        const innerAngle = ((i * 72 + 36) - 90) * Math.PI / 180;
        path += `${i === 0 ? 'M' : 'L'} ${cx + outerR * Math.cos(outerAngle)} ${cy + outerR * Math.sin(outerAngle)} `;
        path += `L ${cx + innerR * Math.cos(innerAngle)} ${cy + innerR * Math.sin(innerAngle)} `;
      }
      return path + 'Z';
    }
    case 'diamond': return `M ${h} ${h * 0.2} L ${h * 1.8} ${h} L ${h} ${h * 1.8} L ${h * 0.2} ${h} Z`;
    case 'hexagon': {
      const cx = h, cy = h, r = h * 0.8;
      let path = '';
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 30) * Math.PI / 180;
        path += `${i === 0 ? 'M' : 'L'} ${cx + r * Math.cos(angle)} ${cy + r * Math.sin(angle)} `;
      }
      return path + 'Z';
    }
    default: return `M ${h * 0.3} ${h * 0.3} L ${h * 1.7} ${h * 0.3} L ${h * 1.7} ${h * 1.7} L ${h * 0.3} ${h * 1.7} Z`;
  }
}

export default function ShapeRenderer({ element, size = 48, showHighlight }: Props) {
  const color = ARC_COLORS[element.color] || ARC_COLORS[1];
  const scale = element.size === 1 ? 0.7 : element.size === 2 ? 1 : 1.3;
  const actualSize = size * scale;
  const isHole = element.type === 'hole';
  const isShadow = element.type === 'shadow';

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: actualSize,
        height: actualSize,
        filter: showHighlight ? 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' : 'none',
      }}
    >
      <svg width={actualSize} height={actualSize} viewBox={`0 0 ${actualSize} ${actualSize}`}
        style={{ transform: `rotate(${element.rotation}deg)` }}>
        {isHole ? (
          <rect
            x={actualSize * 0.18}
            y={actualSize * 0.18}
            width={actualSize * 0.64}
            height={actualSize * 0.64}
            rx={actualSize * 0.08}
            fill="none"
            stroke="rgba(17,17,17,0.35)"
            strokeDasharray="5 5"
            strokeWidth={2}
          />
        ) : isShadow ? (
          <path
            d={getShapePath('hexagon', actualSize)}
            fill="rgba(17,17,17,0.08)"
            stroke="rgba(17,17,17,0.4)"
            strokeWidth={2}
          />
        ) : element.type === 'circle' ? (
          <circle cx={actualSize / 2} cy={actualSize / 2} r={actualSize * 0.4} fill={color} stroke="rgba(17,17,17,0.18)" strokeWidth={1} />
        ) : (
          <path d={getShapePath(element.type, actualSize)} fill={color} stroke="rgba(17,17,17,0.18)" strokeWidth={1} />
        )}
      </svg>
    </motion.div>
  );
}
