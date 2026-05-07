import { useState } from 'react';
import { C, iS } from '../constants.js';

export default function UserManager({ students, setStudents, exercises, exTypes }) {
  const [newName, setNewName] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const add = () => {
    if (!newName.trim()) return;
    setStudents(s => [...s, { id: Date.now(), name: newName.trim(), assignedIds: [] }]);
    setNewName('');
  };

  const rm = id => setStudents(s => s.filter(x => x.id !== id));

  const toggle = (sId, eId) => setStudents(s => s.map(st => {
    if (st.id !== sId) return st;
    const has = st.assignedIds.includes(eId);
    return { ...st, assignedIds: has ? st.assignedIds.filter(x => x !== eId) : [...st.assignedIds, eId] };
  }));

  const getT = id => exTypes.find(t => t.id === id) || { icon: '📝', color: C.muted };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="שם תלמיד חדש..."
          onKeyDown={e => e.key === 'Enter' && add()} style={{ ...iS, flex: 1 }} />
        <button onClick={add} style={{ padding: '9px 20px', background: C.y, color: '#000', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>+ הוסף</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {students.map(st => {
          const isExp = expandedId === st.id;
          return (
            <div key={st.id} style={{ background: C.card, borderRadius: 10, border: '1px solid ' + (isExp ? C.y + '44' : C.borderLit), overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.y + '22', border: '1px solid ' + C.y + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: C.y, flexShrink: 0 }}>{st.name.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{st.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{st.assignedIds.length + ' תרגילים מוקצים'}</div>
                </div>
                <button onClick={() => setExpandedId(isExp ? null : st.id)}
                  style={{ padding: '6px 14px', background: isExp ? C.y + '22' : 'transparent', color: isExp ? C.y : C.muted, border: '1px solid ' + (isExp ? C.y : C.borderLit), borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  {isExp ? '▲ סגור' : '▼ הקצה'}
                </button>
                <button onClick={() => rm(st.id)} style={{ padding: '6px 12px', background: 'transparent', color: C.red, border: '1px solid ' + C.red, borderRadius: 7, cursor: 'pointer', fontSize: 12 }}>מחק</button>
              </div>
              {isExp && (
                <div style={{ borderTop: '1px solid ' + C.dim, padding: '14px 16px', background: C.panel }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>בחר תרגילים:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8 }}>
                    {exercises.map(ex => {
                      const checked = st.assignedIds.includes(ex.id);
                      const t = getT(ex.type);
                      return (
                        <div key={ex.id} onClick={() => toggle(st.id, ex.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: checked ? t.color + '14' : C.card, border: '1px solid ' + (checked ? t.color + '55' : C.borderLit), borderRadius: 8, cursor: 'pointer' }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, background: checked ? t.color : C.dim, border: '1px solid ' + (checked ? t.color : C.borderLit), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0, color: '#000', fontWeight: 900 }}>{checked && '✓'}</div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{ex.title}</div>
                            <div style={{ fontSize: 10, color: t.color || C.muted }}>{ex.diff}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
