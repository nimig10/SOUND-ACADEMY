import { C } from '../constants.js';

export default function VU({ level }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 1.5, height: 76 }}>
      {Array.from({ length: 14 }, (_, i) => {
        const on = level > i / 14;
        const col = i > 11 ? C.red : i > 9 ? C.y : C.green;
        return <div key={i} style={{ flex: 1, background: on ? col : '#111', borderRadius: 1, transition: 'background 55ms' }} />;
      })}
    </div>
  );
}
