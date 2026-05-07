import { useState } from 'react';
import { C } from '../constants.js';
import UserManager from './UserManager.jsx';
import ExerciseManager from './ExerciseManager.jsx';
import TypeManager from './TypeManager.jsx';
import MixerSetup from './MixerSetup.jsx';

export default function AdminPanel({ exercises, setExercises, students, setStudents, exTypes, setExTypes, mixerChs, setMixerChs }) {
  const [tab, setTab] = useState('users');

  return (
    <div>
      <h1 style={{ fontSize: 23, fontWeight: 900, color: C.y, margin: '0 0 5px' }}>⚙️ ניהול</h1>
      <div style={{ display: 'flex', gap: 6, marginBottom: 22, flexWrap: 'wrap' }}>
        {[
          { id: 'users',     l: '👥 משתמשים' },
          { id: 'exercises', l: '📋 תרגילים' },
          { id: 'types',     l: '🏷️ סוגים' },
          { id: 'mixer',     l: '🎚️ הגדרת מיקסר' },
        ].map(({ id, l }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '9px 18px', background: tab === id ? C.y : C.card, color: tab === id ? '#000' : C.muted, border: '1px solid ' + (tab === id ? C.y : C.borderLit), borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'users'     && <UserManager     students={students} setStudents={setStudents} exercises={exercises} exTypes={exTypes} />}
      {tab === 'exercises' && <ExerciseManager exercises={exercises} setExercises={setExercises} exTypes={exTypes} setExTypes={setExTypes} />}
      {tab === 'types'     && <TypeManager     exTypes={exTypes} setExTypes={setExTypes} />}
      {tab === 'mixer'     && <MixerSetup      channels={mixerChs} setChannels={setMixerChs} />}
    </div>
  );
}
