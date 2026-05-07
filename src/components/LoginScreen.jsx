import { useState } from 'react';
import { C, iS, lS } from '../constants.js';

export default function LoginScreen({ students, onLogin }) {
  const [role, setRole] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [adminName, setAdminName] = useState('');

  const canLogin = role === 'admin' ? !!adminName : !!studentId;

  const doLogin = () => {
    if (role === 'admin') {
      onLogin({ name: adminName, role: 'admin' });
    } else {
      const s = students.find(x => x.id === +studentId);
      if (s) onLogin({ name: s.name, role: 'student', studentId: s.id });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% -20%,#1f1600,' + C.bg + ' 55%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI',Arial,sans-serif", direction: 'rtl' }}>
      <div style={{ width: 380, padding: '44px 38px', background: C.card, borderRadius: 20, border: '1px solid ' + C.borderLit, boxShadow: '0 24px 80px rgba(0,0,0,.95)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🎚️</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.y, letterSpacing: 4, fontFamily: 'monospace' }}>SOUND ACADEMY</div>
          <div style={{ width: 44, height: 2, background: C.y, margin: '12px auto', borderRadius: 1 }} />
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2 }}>מרכז האימון לסאונד</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lS}>כניסה כ</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[{ r: 'student', l: '🎧 תלמיד' }, { r: 'admin', l: '⚙️ מנהל' }].map(({ r, l }) => (
              <button key={r} onClick={() => { setRole(r); setStudentId(''); setAdminName(''); }}
                style={{ padding: '12px', background: role === r ? C.y : C.panel, color: role === r ? '#000' : C.muted, border: '1px solid ' + (role === r ? C.y : C.border), borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {role === 'student' && (
          <div style={{ marginBottom: 22 }}>
            <label style={lS}>בחר תלמיד</label>
            <select value={studentId} onChange={e => setStudentId(e.target.value)} style={{ ...iS, cursor: 'pointer' }}>
              <option value="">— בחר מהרשימה —</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.assignedIds.length} תרגילים)</option>)}
            </select>
          </div>
        )}

        {role === 'admin' && (
          <div style={{ marginBottom: 22 }}>
            <label style={lS}>שם מנהל</label>
            <input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="הכנס שמך..." style={iS} />
          </div>
        )}

        {!role && <div style={{ height: 22, marginBottom: 22 }} />}

        <button onClick={doLogin} disabled={!canLogin}
          style={{ width: '100%', padding: 14, background: canLogin ? C.y : C.yDim, color: '#000', border: 'none', borderRadius: 8, fontWeight: 900, fontSize: 15, cursor: canLogin ? 'pointer' : 'not-allowed', letterSpacing: 1.5 }}>
          כניסה למערכת ›
        </button>
      </div>
    </div>
  );
}
