export const C = {
  bg: '#080808', card: '#141414', panel: '#0c0c0c',
  y: '#FFD700', yDim: '#7a5c00', yMid: '#b38a00',
  text: '#f0f0f0', muted: '#666', dim: '#1e1e1e',
  border: '#1a1a1a', borderLit: '#2e2e2e',
  green: '#00e87a', red: '#ff3355', blue: '#44aaff',
};

export const iS = {
  width: '100%', padding: '9px 12px', background: C.panel,
  border: '1px solid #2e2e2e', borderRadius: 7, color: '#f0f0f0',
  fontSize: 13, outline: 'none', boxSizing: 'border-box', direction: 'rtl',
};

export const lS = {
  display: 'block', fontSize: 10, color: '#666', marginBottom: 5, letterSpacing: .5,
};

export const BUILT_IN_TYPES = ['freq', 'eq', 'effects'];

export const DIFF_COL = { קל: C.green, בינוני: C.y, קשה: C.red };

export const INIT_EX_TYPES = [
  { id: 'freq',    label: 'זיהוי תדרים', icon: '🎵', color: '#4488ff' },
  { id: 'eq',      label: 'אימון EQ',    icon: '📈', color: '#FFD700' },
  { id: 'effects', label: 'אפקטים',      icon: '🌀', color: '#ff44bb' },
];

export const INIT_STUDENTS = [
  { id: 1, name: 'ינאי',       assignedIds: [1, 2] },
  { id: 2, name: 'שרה',        assignedIds: [1, 3] },
  { id: 3, name: 'דוד',        assignedIds: [2, 3, 4] },
  { id: 4, name: 'שגיב אוחנה', assignedIds: [1, 2, 3, 4] },
];

export const INIT_EXERCISES = [
  { id: 1, type: 'freq',    title: 'זיהוי תדרים — בסיסי',   diff: 'קל',    description: 'זהה תדרי מרכז של צלילים מסוננים', instructions: '', audioUrl: null, audioName: null, notes: '' },
  { id: 2, type: 'eq',      title: 'EQ — דחיפת בסים 80Hz',  diff: 'בינוני', description: 'כוון את ה-EQ להתאמת הטרגט',         instructions: '', audioUrl: null, audioName: null, notes: '' },
  { id: 3, type: 'effects', title: 'Reverb Hall — חדר גדול', diff: 'קשה',   description: 'כוון פרמטרי Reverb',                instructions: '', audioUrl: null, audioName: null, notes: '' },
  { id: 4, type: 'effects', title: 'Delay — Quarter Note',   diff: 'בינוני', description: 'כוון פרמטרי Delay',                 instructions: '', audioUrl: null, audioName: null, notes: '' },
];

export const INIT_MIX_CHS = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  name: i === 15 ? 'Master' : 'Ch ' + (i + 1),
  audioUrl: null,
  audioName: null,
}));
