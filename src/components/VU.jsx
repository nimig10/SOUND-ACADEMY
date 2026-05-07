import { C } from '../constants.js';

export default function VU({ level, ht = 76 }) {
  const bars = Math.round(ht / 4.5);
  return (
    <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 1.5, height: ht, width: 8 }}>
      {Array.from({ length: bars }, (_, i) => {
        const on = level > i / bars;
        const pct = i / bars;
        const col = pct > 0.88 ? C.red : pct > 0.72 ? C.y : C.green;
        return <div key={i} style={{ flex: 1, background: on ? col : '#111', borderRadius: 1, transition: 'background 55ms', boxShadow: on && pct > 0.88 ? '0 0 3px ' + C.red : undefined }} />;
      })}
    </div>
  );
}
