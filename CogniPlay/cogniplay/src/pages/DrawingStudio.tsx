import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Stroke = { color: string; size: number; points: { x: number; y: number }[] };

const COLORS = ['#111111', '#315C52', '#B96B5E', '#D6BB91', '#9DC8C3'];
const STICKERS = ['○', '□', '△', '◇', '✦'];

export default function DrawingStudio() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(8);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<Stroke | null>(null);

  const redraw = (nextStrokes: Stroke[], active?: Stroke | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    [...nextStrokes, ...(active ? [active] : [])].forEach(stroke => {
      if (stroke.points.length === 0) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    });
  };

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (event.currentTarget.width / rect.width),
      y: (event.clientY - rect.top) * (event.currentTarget.height / rect.height),
    };
  };

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div>
          <h2>Drawing Studio</h2>
          <p style={{ color: 'var(--ink-muted)' }}>Draw, place simple stickers, and make a calm play picture.</p>
        </div>
        <button className="btn btn--secondary" onClick={() => navigate('/worlds')}>Worlds</button>
      </div>

      <div className="glass-card glass-card--static" style={{ padding: 'var(--space-3)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        {COLORS.map(item => (
          <button
            key={item}
            onClick={() => setColor(item)}
            aria-label={`Color ${item}`}
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              border: color === item ? '3px solid var(--ink)' : '1px solid var(--paper-line)',
              background: item,
              cursor: 'pointer',
            }}
          />
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--ink)' }}>
          Thickness
          <input type="range" min={3} max={24} value={size} onChange={event => setSize(Number(event.target.value))} />
        </label>
        {STICKERS.map(sticker => (
          <button
            key={sticker}
            className="btn btn--secondary"
            onClick={() => {
              const canvas = canvasRef.current;
              const ctx = canvas?.getContext('2d');
              if (!canvas || !ctx) return;
              ctx.font = '72px Outfit, sans-serif';
              ctx.fillStyle = color;
              ctx.fillText(sticker, canvas.width / 2 - 36, canvas.height / 2 + 36);
            }}
          >
            {sticker}
          </button>
        ))}
        <button
          className="btn btn--secondary"
          onClick={() => {
            const next = strokes.slice(0, -1);
            setStrokes(next);
            redraw(next);
          }}
        >
          Undo
        </button>
        <button
          className="btn btn--secondary"
          onClick={() => {
            setStrokes([]);
            redraw([]);
          }}
        >
          Clear
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={1400}
        height={860}
        style={{
          width: '100%',
          flex: 1,
          minHeight: 520,
          background: '#fffdfa',
          border: '1px solid var(--paper-line)',
          borderRadius: 8,
          touchAction: 'none',
          boxShadow: 'var(--paper-shadow-sm)',
        }}
        onPointerDown={(event) => {
          const stroke = { color, size, points: [pointFromEvent(event)] };
          setCurrent(stroke);
          event.currentTarget.setPointerCapture(event.pointerId);
          redraw(strokes, stroke);
        }}
        onPointerMove={(event) => {
          if (!current) return;
          const next = { ...current, points: [...current.points, pointFromEvent(event)] };
          setCurrent(next);
          redraw(strokes, next);
        }}
        onPointerUp={() => {
          if (!current) return;
          const next = [...strokes, current];
          setStrokes(next);
          setCurrent(null);
          redraw(next);
        }}
      />
    </div>
  );
}
