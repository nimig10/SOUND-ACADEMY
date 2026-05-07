import { useState, useRef, useEffect } from 'react';
import { C, DIFF_COL } from '../constants.js';

export default function GenericExercise({ exercise, exTypes, onComplete }) {
  const type = exTypes.find(t => t.id === exercise.type) || { icon: '📝', label: 'תרגיל', color: C.muted };
  const actxRef = useRef(null);
  const srcRef  = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [done,    setDone]    = useState(false);

  const toggleAudio = async () => {
    if (playing) {
      try { srcRef.current && srcRef.current.stop(); } catch (e) {}
      setPlaying(false); return;
    }
    if (!exercise.audioUrl) return;
    try {
      const ctx = actxRef.current || (actxRef.current = new (window.AudioContext || window.webkitAudioContext)());
      if (ctx.state === 'suspended') ctx.resume();
      const resp = await fetch(exercise.audioUrl);
      const raw  = await resp.arrayBuffer();
      const buf  = await ctx.decodeAudioData(raw);
      const src  = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination);
      src.start(); src.onended = () => setPlaying(false); srcRef.current = src; setPlaying(true);
    } catch (e) { console.error(e); }
  };

  useEffect(() => () => { try { srcRef.current && srcRef.current.stop(); } catch (e) {} });

  const markDone = () => { setDone(true); if (onComplete) onComplete(100); };

  return (
    <div style={{ background: C.card, padding: 32, borderRadius: 12, border: '1px solid ' + type.color + '44', maxWidth: 580 }}>
      <div style={{ fontSize: 44, marginBottom: 14 }}>{type.icon}</div>
      <h2 style={{ color: C.text, margin: '0 0 6px', fontSize: 20, fontWeight: 900 }}>{exercise.title}</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: type.color, background: type.color + '18', padding: '3px 10px', borderRadius: 8, border: '1px solid ' + type.color + '44' }}>{type.label}</span>
        <span style={{ fontSize: 11, color: DIFF_COL[exercise.diff] || C.muted, background: (DIFF_COL[exercise.diff] || C.muted) + '18', padding: '3px 10px', borderRadius: 8 }}>{exercise.diff}</span>
      </div>
      {exercise.description && <p style={{ color: C.muted, margin: '0 0 14px', fontSize: 14 }}>{exercise.description}</p>}
      {exercise.instructions && (
        <div style={{ background: C.panel, padding: 16, borderRadius: 8, border: '1px solid ' + C.borderLit, marginBottom: 20, color: C.text, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {exercise.instructions}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {exercise.audioUrl && (
          <button onClick={toggleAudio} style={{ padding: '10px 20px', background: playing ? C.red : C.green, color: '#000', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>
            {playing ? '■ עצור' : '▶ השמע אודיו'}
          </button>
        )}
        <button onClick={markDone} disabled={done}
          style={{ padding: '10px 24px', background: done ? C.yDim : C.y, color: '#000', border: 'none', borderRadius: 8, fontWeight: 800, cursor: done ? 'not-allowed' : 'pointer', fontSize: 13 }}>
          {done ? '✓ הושלם' : 'סמן כהושלם'}
        </button>
      </div>
    </div>
  );
}
