import { useState } from 'react';
import { C, BUILT_IN_TYPES, INIT_STUDENTS, INIT_EXERCISES, INIT_EX_TYPES, INIT_MIX_CHS } from './constants.js';
import { useTable, useScores } from './hooks/useSupabase.js';

import LoginScreen    from './components/LoginScreen.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import AdminPanel     from './components/AdminPanel.jsx';

import StudentHome    from './student/StudentHome.jsx';
import StudentMixer   from './student/StudentMixer.jsx';
import ExerciseHeader from './student/ExerciseHeader.jsx';

import FreqTrain        from './training/FreqTrain.jsx';
import EQTrain          from './training/EQTrain.jsx';
import FXTrain          from './training/FXTrain.jsx';
import CompressorTrain  from './training/CompressorTrain.jsx';
import GateTrain        from './training/GateTrain.jsx';
import GenericExercise  from './training/GenericExercise.jsx';

export default function App() {
  // Supabase-backed state
  const [students,  setStudents,  studentsLoaded]  = useTable('students',        INIT_STUDENTS);
  const [exercises, setExercises, exercisesLoaded] = useTable('exercises',       INIT_EXERCISES);
  const [exTypes,   setExTypes,   typesLoaded]     = useTable('ex_types',        INIT_EX_TYPES);
  const [mixerChs,  setMixerChs,  mixerLoaded]     = useTable('mixer_channels',  INIT_MIX_CHS);

  // Session-only state
  const [user,     setUser]     = useState(null);
  const [view,     setView]     = useState('home');
  const [activeEx, setActiveEx] = useState(null);

  const curStudent = user?.role === 'student' ? students.find(s => s.id === user.studentId) : null;

  // Per-student scores from Supabase
  const [doneMap, saveScore] = useScores(user?.studentId);

  const startEx        = ex    => { setActiveEx(ex); setView('exercise'); };
  const backHome       = ()    => { setActiveEx(null); setView('home'); };
  const handleComplete = score => { if (activeEx) saveScore(activeEx.id, score); };

  const allLoaded = studentsLoaded && exercisesLoaded && typesLoaded && mixerLoaded;

  if (!user) return <LoginScreen students={students} onLogin={setUser} />;

  if (!allLoaded) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.y, fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>⏳ טוען נתונים...</div>
    </div>
  );

  const adminNav   = [{ id: 'dashboard', icon: '📊', label: 'דשבורד' }, { id: 'admin', icon: '⚙️', label: 'ניהול' }];
  const studentNav = [{ id: 'home', icon: '📋', label: 'התרגילים שלי' }, { id: 'mixer', icon: '🎚️', label: 'מיקסר' }];
  const nav = user.role === 'admin' ? adminNav : studentNav;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'Segoe UI',Arial,sans-serif", direction: 'rtl', color: C.text }}>
      {/* Sidebar */}
      <div style={{ width: 196, background: C.card, borderLeft: '1px solid ' + C.borderLit, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid ' + C.dim }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: C.y, letterSpacing: 1 }}>🎚️ SOUND ACADEMY</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>{user.name}</div>
          <div style={{ fontSize: 10, color: C.yMid }}>{user.role === 'admin' ? '⚙️ מנהל' : '🎧 תלמיד'}</div>
        </div>
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {nav.map(item => (
            <button key={item.id} onClick={() => { setView(item.id); setActiveEx(null); }}
              style={{ width: '100%', padding: '10px 16px', background: view === item.id && !activeEx ? 'rgba(255,215,0,.1)' : 'transparent', color: view === item.id && !activeEx ? C.y : C.muted, border: 'none', borderRight: view === item.id && !activeEx ? '3px solid ' + C.y : '3px solid transparent', cursor: 'pointer', textAlign: 'right', fontSize: 13, display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ padding: 12, borderTop: '1px solid ' + C.dim }}>
          <button onClick={() => setUser(null)} style={{ width: '100%', padding: 9, background: 'transparent', color: C.muted, border: '1px solid ' + C.dim, borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>יציאה</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '26px 28px' }}>
        {user.role === 'admin' && view === 'dashboard' && (
          <AdminDashboard students={students} exercises={exercises} exTypes={exTypes} />
        )}
        {user.role === 'admin' && view === 'admin' && (
          <AdminPanel
            exercises={exercises} setExercises={setExercises}
            students={students}   setStudents={setStudents}
            exTypes={exTypes}     setExTypes={setExTypes}
            mixerChs={mixerChs}   setMixerChs={setMixerChs}
          />
        )}
        {user.role === 'student' && view === 'home' && !activeEx && curStudent && (
          <StudentHome student={curStudent} exercises={exercises} exTypes={exTypes} doneMap={doneMap} onStart={startEx} />
        )}
        {user.role === 'student' && view === 'mixer' && (
          <StudentMixer channels={mixerChs} />
        )}
        {user.role === 'student' && view === 'exercise' && activeEx && (
          <>
            <ExerciseHeader exercise={activeEx} exTypes={exTypes} onBack={backHome} />
            {activeEx.type === 'freq'       && <FreqTrain       onComplete={handleComplete} />}
            {activeEx.type === 'eq'         && <EQTrain         onComplete={handleComplete} />}
            {activeEx.type === 'effects'    && <FXTrain         onComplete={handleComplete} />}
            {activeEx.type === 'compressor' && <CompressorTrain onComplete={handleComplete} />}
            {activeEx.type === 'gate'       && <GateTrain       onComplete={handleComplete} />}
            {!BUILT_IN_TYPES.includes(activeEx.type) && <GenericExercise exercise={activeEx} exTypes={exTypes} onComplete={handleComplete} />}
          </>
        )}
      </div>
    </div>
  );
}
