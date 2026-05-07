import { C, BUILT_IN_TYPES } from '../constants.js';

export default function TypeManager({ exTypes, setExTypes }) {
  return (
    <div>
      <div style={{ fontWeight: 700, color: C.y, marginBottom: 8, fontSize: 13 }}>🏷️ סוגי תרגילים</div>
      <p style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>להוספת סוג חדש — לחץ + ליד בחירת הסוג בעת יצירת תרגיל.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {exTypes.map(t => {
          const isB = BUILT_IN_TYPES.includes(t.id);
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: C.card, borderRadius: 8, border: '1px solid ' + t.color + '33' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: t.color + '20', border: '1px solid ' + t.color + '55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{t.label}</div>
                <div style={{ fontSize: 10, color: isB ? C.blue : C.green, marginTop: 2 }}>{isB ? 'מובנה' : 'מותאם אישית'}</div>
              </div>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
              {!isB && (
                <button onClick={() => setExTypes(x => x.filter(e => e.id !== t.id))}
                  style={{ padding: '4px 10px', background: 'transparent', color: C.red, border: '1px solid ' + C.red, borderRadius: 5, cursor: 'pointer', fontSize: 11, flexShrink: 0 }}>
                  מחק
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
