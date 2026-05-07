import { C } from '../constants.js';

export default function AdminDashboard({ students, exercises, exTypes }) {
  const total = students.reduce((a, s) => a + s.assignedIds.length, 0);

  return (
    <div>
      <h1 style={{ fontSize: 23, fontWeight: 900, color: C.y, margin: '0 0 5px' }}>📊 דשבורד</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 22 }}>
        {[{ l: 'תלמידים', v: students.length, i: '👥' }, { l: 'תרגילים', v: exercises.length, i: '📋' }, { l: 'הקצאות', v: total, i: '🔗' }].map(({ l, v, i }) => (
          <div key={l} style={{ background: C.card, padding: 18, borderRadius: 10, border: '1px solid ' + C.borderLit }}>
            <div style={{ fontSize: 20 }}>{i}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: C.y, margin: '7px 0 3px' }}>{v}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.borderLit, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + C.dim, fontWeight: 700, color: C.y, fontSize: 13 }}>תלמידים</div>
        {students.map(st => {
          const exNames = exercises.filter(e => st.assignedIds.includes(e.id)).map(e => e.title);
          return (
            <div key={st.id} style={{ padding: '12px 16px', borderBottom: '1px solid ' + C.dim, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.y + '22', border: '1px solid ' + C.y + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: C.y, flexShrink: 0 }}>{st.name.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{st.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{exNames.length ? exNames.join(' · ') : 'אין תרגילים מוקצים'}</div>
              </div>
              <span style={{ fontSize: 11, color: C.y, background: C.y + '18', padding: '3px 10px', borderRadius: 8, flexShrink: 0 }}>{st.assignedIds.length + ' תרגילים'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
