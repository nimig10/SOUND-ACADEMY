import { C, DIFF_COL } from '../constants.js';

export default function StudentHome({ student, exercises, exTypes, doneMap, onStart }) {
  const assigned   = exercises.filter(e => student.assignedIds.includes(e.id));
  const doneCount  = assigned.filter(e => doneMap[e.id] != null).length;
  const getT = id => exTypes.find(t => t.id === id) || { icon: '📝', label: 'תרגיל', color: C.muted };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 23, fontWeight: 900, color: C.y, margin: '0 0 5px' }}>התרגילים שלי 📋</h1>
        <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>
          {assigned.length === 0 ? 'אין תרגילים מוקצים עדיין' : (doneCount + '/' + assigned.length + ' תרגילים הושלמו')}
        </p>
      </div>

      {assigned.length === 0 && (
        <div style={{ background: C.card, padding: 40, borderRadius: 12, border: '1px solid ' + C.borderLit, textAlign: 'center', color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div>פנה למנהל לקבלת תרגילים</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 14 }}>
        {assigned.map(ex => {
          const t = getT(ex.type);
          const done  = doneMap[ex.id] != null;
          const score = doneMap[ex.id];
          return (
            <div key={ex.id} style={{ background: C.card, padding: 20, borderRadius: 12, border: '1px solid ' + (done ? t.color + '44' : C.borderLit), position: 'relative', overflow: 'hidden' }}>
              {done && <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 10, background: t.color + '22', color: t.color, padding: '3px 8px', borderRadius: 10, border: '1px solid ' + t.color + '44', fontWeight: 700 }}>✓ הושלם</div>}
              <div style={{ fontSize: 28, marginBottom: 10 }}>{t.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{ex.title}</div>
              {ex.description && <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{ex.description}</div>}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: t.color, background: t.color + '18', padding: '2px 8px', borderRadius: 8 }}>{t.label}</span>
                <span style={{ fontSize: 11, color: DIFF_COL[ex.diff] || C.muted, background: (DIFF_COL[ex.diff] || C.muted) + '18', padding: '2px 8px', borderRadius: 8 }}>{ex.diff}</span>
              </div>
              {done ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: score > 70 ? C.green : score > 40 ? C.y : C.red, fontWeight: 700 }}>{'ניקוד: ' + score + '/100'}</span>
                  <button onClick={() => onStart(ex)} style={{ padding: '7px 14px', background: 'transparent', color: C.muted, border: '1px solid ' + C.borderLit, borderRadius: 7, cursor: 'pointer', fontSize: 12 }}>נסה שוב</button>
                </div>
              ) : (
                <button onClick={() => onStart(ex)} style={{ width: '100%', padding: '10px', background: C.y, color: '#000', border: 'none', borderRadius: 7, fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>▶ התחל תרגיל</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
