import { C } from '../constants.js';

export default function Knob({ val, min = 0, max = 1, onChange, label, size = 52, color = C.y }) {
  const pct = (val - min) / (max - min);
  const angle = pct * 270 - 135;
  const rad = (angle - 90) * Math.PI / 180;
  const r = size / 2 - 7;
  const dx = size / 2 + r * Math.cos(rad);
  const dy = size / 2 + r * Math.sin(rad);

  const onDown = e => {
    e.preventDefault();
    const sy = e.clientY, sv = val;
    const mv = m => onChange(Math.max(min, Math.min(max, sv + (sy - m.clientY) / 130 * (max - min))));
    const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', mv);
    window.addEventListener('mouseup', up);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, userSelect: 'none' }} onMouseDown={onDown}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,#353535,#0d0d0d)', border: '1.5px solid #303030', position: 'relative', cursor: 'ns-resize', boxShadow: '0 3px 8px rgba(0,0,0,.7)' }}>
        <div style={{ position: 'absolute', width: 5, height: 5, borderRadius: '50%', background: color, left: dx - 2.5, top: dy - 2.5, boxShadow: '0 0 6px ' + color + '88' }} />
      </div>
      <span style={{ fontSize: 9, color: C.muted, letterSpacing: .5, textAlign: 'center', maxWidth: size + 8, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{label}</span>
    </div>
  );
}
