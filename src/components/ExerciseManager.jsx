import { useState } from 'react';
import { C, DIFF_COL } from '../constants.js';
import ExerciseModal from './ExerciseModal.jsx';
import ExercisePreviewModal from './ExercisePreviewModal.jsx';

export default function ExerciseManager({ exercises, setExercises, exTypes, setExTypes }) {
  const [modal, setModal] = useState(null);
  const [preview, setPreview] = useState(null);

  const save = form => {
    if (modal === 'new') setExercises(e => [...e, { ...form, id: Date.now() }]);
    else setExercises(e => e.map(x => x.id === modal.id ? { ...x, ...form } : x));
    setModal(null);
  };

  const getT = id => exTypes.find(t => t.id === id) || { icon: '📝', label: 'תרגיל', color: C.muted };

  return (
    <div>
      {modal && <ExerciseModal exercise={modal === 'new' ? null : modal} onSave={save} onClose={() => setModal(null)} exTypes={exTypes} setExTypes={setExTypes} />}
      {preview && <ExercisePreviewModal exercise={preview} exTypes={exTypes} onClose={() => setPreview(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: C.y, fontSize: 13 }}>{'📋 תרגילים (' + exercises.length + ')'}</div>
        <button onClick={() => setModal('new')} style={{ padding: '9px 20px', background: C.y, color: '#000', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>+ תרגיל חדש</button>
      </div>

      {exercises.length === 0 && <div style={{ background: C.card, padding: 32, borderRadius: 10, border: '1px solid ' + C.borderLit, textAlign: 'center', color: C.muted }}>אין תרגילים עדיין</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {exercises.map(ex => {
          const t = getT(ex.type);
          return (
            <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: C.card, borderRadius: 10, border: '1px solid ' + C.borderLit }}>
              <div style={{ width: 36, height: 36, background: t.color + '18', border: '1px solid ' + t.color + '44', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{ex.title}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  <span style={{ color: t.color }}>{t.label}</span>{' · '}
                  <span style={{ color: DIFF_COL[ex.diff] || C.muted }}>{ex.diff}</span>
                  {ex.description && (' · ' + ex.description.slice(0, 36) + (ex.description.length > 36 ? '...' : ''))}
                  {ex.audioName && <span style={{ color: C.green }}> · 🎵</span>}
                </div>
              </div>
              <button onClick={() => setPreview(ex)} style={{ padding: '5px 12px', background: t.color + '14', color: t.color, border: '1px solid ' + t.color + '55', borderRadius: 6, cursor: 'pointer', fontSize: 12, flexShrink: 0, fontWeight: 700 }}>👁 הצג</button>
              <button onClick={() => setModal(ex)} style={{ padding: '5px 12px', background: 'transparent', color: C.blue, border: '1px solid ' + C.blue, borderRadius: 6, cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>עריכה</button>
              <button onClick={() => setExercises(e => e.filter(x => x.id !== ex.id))} style={{ padding: '5px 10px', background: 'transparent', color: C.red, border: '1px solid ' + C.red, borderRadius: 6, cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>מחק</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
