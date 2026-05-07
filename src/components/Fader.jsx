import { useRef } from 'react';
import { C } from '../constants.js';

export default function Fader({ val, onChange, ht = 120 }) {
  const ref = useRef();

  const onDown = e => {
    e.preventDefault();
    const mv = m => {
      const rc = ref.current.getBoundingClientRect();
      onChange(Math.max(0, Math.min(1, 1 - (m.clientY - rc.top) / rc.height)));
    };
    const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', mv);
    window.addEventListener('mouseup', up);
  };

  return (
    <div ref={ref} onMouseDown={onDown} style={{ width: 20, height: ht, background: '#0a0a0a', borderRadius: 10, border: '1px solid #2a2a2a', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
      <div style={{ position: 'absolute', left: '50%', top: 8, bottom: 8, width: 2, background: '#1e1e1e', transform: 'translateX(-50%)' }} />
      <div style={{ position: 'absolute', left: '50%', top: (1 - val) * (ht - 22), width: 28, height: 22, background: 'linear-gradient(180deg,#454545,#1c1c1c)', border: '1.5px solid ' + C.y + '55', borderRadius: 4, transform: 'translateX(-50%)' }} />
    </div>
  );
}
