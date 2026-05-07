import { C } from '../constants.js';

export default function ExerciseHeader({ exercise, exTypes, onBack }) {
  const t = exTypes.find(x => x.id === exercise.type) || { icon: '📝', label: 'תרגיל', color: C.muted };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, padding: '10px 16px', background: C.card, borderRadius: 10, border: '1px solid ' + C.borderLit }}>
      <button onClick={onBack} style={{ padding: '7px 14px', background: 'transparent', color: C.muted, border: '1px solid ' + C.borderLit, borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>◀ חזור</button>
      <span style={{ fontSize: 18 }}>{t.icon}</span>
      <div>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{exercise.title}</div>
        <div style={{ fontSize: 11, color: t.color }}>{t.label}</div>
      </div>
    </div>
  );
}
