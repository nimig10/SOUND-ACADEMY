import { C, BUILT_IN_TYPES, DIFF_COL } from '../constants.js';
import FreqTrain from '../training/FreqTrain.jsx';
import EQTrain from '../training/EQTrain.jsx';
import FXTrain from '../training/FXTrain.jsx';
import GenericExercise from '../training/GenericExercise.jsx';

export default function ExercisePreviewModal({ exercise, exTypes, onClose }) {
  const type = exTypes.find(t => t.id === exercise.type) || { icon: '📝', label: 'תרגיל', color: C.muted };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16, overflowY: 'auto' }}>
      <div style={{ width: 'min(780px,100%)', background: C.bg, borderRadius: 18, border: '2px solid ' + type.color + '55', direction: 'rtl', boxShadow: '0 32px 80px rgba(0,0,0,.95)', display: 'flex', flexDirection: 'column', maxHeight: '94vh' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid ' + C.dim, display: 'flex', alignItems: 'center', gap: 12, background: C.card, borderRadius: '16px 16px 0 0', flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, background: type.color + '20', border: '1px solid ' + type.color + '55', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{type.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, color: C.text, fontSize: 15 }}>{exercise.title}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: type.color, background: type.color + '18', padding: '2px 8px', borderRadius: 7, border: '1px solid ' + type.color + '44' }}>{type.label}</span>
              <span style={{ fontSize: 10, color: DIFF_COL[exercise.diff] || C.muted, background: (DIFF_COL[exercise.diff] || C.muted) + '18', padding: '2px 8px', borderRadius: 7 }}>{exercise.diff}</span>
            </div>
          </div>
          <div style={{ padding: '4px 12px', background: type.color + '18', border: '1px solid ' + type.color + '44', borderRadius: 6, fontSize: 10, color: type.color, fontWeight: 700, letterSpacing: 1 }}>PREVIEW</div>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid ' + C.borderLit, color: C.muted, fontSize: 16, cursor: 'pointer', borderRadius: 6, padding: '4px 10px', flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '22px 24px', flex: 1 }}>
          {exercise.type === 'freq'    && <FreqTrain onComplete={() => {}} />}
          {exercise.type === 'eq'      && <EQTrain onComplete={() => {}} />}
          {exercise.type === 'effects' && <FXTrain onComplete={() => {}} />}
          {!BUILT_IN_TYPES.includes(exercise.type) && <GenericExercise exercise={exercise} exTypes={exTypes} onComplete={() => {}} />}
          {exercise.notes && (
            <div style={{ marginTop: 22, padding: '10px 14px', background: 'rgba(255,51,85,.06)', border: '1px solid rgba(255,51,85,.2)', borderRadius: 7 }}>
              <div style={{ fontSize: 10, color: C.red, marginBottom: 4, letterSpacing: .5 }}>🔒 הערות פנימיות (מנהל בלבד)</div>
              <div style={{ fontSize: 12, color: '#cc6677' }}>{exercise.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
