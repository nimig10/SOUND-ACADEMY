import { useState } from 'react';
import { C, iS, lS, BUILT_IN_TYPES } from '../constants.js';
import { supabase } from '../lib/supabase.js';
import AdminSignalPicker from './AdminSignalPicker.jsx';
import { parseSignalFromNotes, serializeSignalToNotes } from '../hooks/useSignalSource.js';

export default function ExerciseModal({ exercise, onSave, onClose, exTypes, setExTypes }) {
  const initSignal = parseSignalFromNotes(exercise?.notes);
  const def = {
    title: '', type: exTypes[0]?.id || 'freq', diff: 'קל',
    description: '', instructions: '',
    audioUrl: null, audioName: null,
    notes: '',
    signalType: 'auto', signalConfig: null,
  };
  const [form, setForm] = useState(exercise
    ? { ...exercise, notes: initSignal.pureNotes, signalType: initSignal.signalType, signalConfig: initSignal.signalConfig }
    : def
  );
  const [ntOpen,    setNtOpen]    = useState(false);
  const [nt,        setNt]        = useState({ label: '', icon: '🎯', color: '#44aaff' });
  const [uploading, setUploading] = useState(false);

  const f = (k, v) => setForm(x => ({ ...x, [k]: v }));

  const addType = () => {
    if (!nt.label) return;
    const id = 't_' + Date.now();
    setExTypes(t => [...t, { id, label: nt.label, icon: nt.icon, color: nt.color }]);
    f('type', id);
    setNtOpen(false);
    setNt({ label: '', icon: '🎯', color: '#44aaff' });
  };

  const handleAudio = async file => {
    if (!file) return;
    setUploading(true);
    const path = `exercises/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('audio').upload(path, file, { upsert: true });
    if (error) { alert('שגיאה בהעלאה: ' + error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(path);
    setForm(x => ({ ...x, audioUrl: publicUrl, audioName: file.name }));
    setUploading(false);
  };

  const handleSave = () => {
    if (!form.title) return;
    const { signalType, signalConfig, notes, ...rest } = form;
    onSave({ ...rest, notes: serializeSignalToNotes(signalType, signalConfig, notes) });
  };

  const curType  = exTypes.find(t => t.id === form.type);
  const isCustom = !BUILT_IN_TYPES.includes(form.type);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ width: 580, maxHeight: '90vh', overflowY: 'auto', background: C.card, borderRadius: 16, border: '1px solid ' + C.borderLit, padding: 28, direction: 'rtl', boxShadow: '0 32px 80px rgba(0,0,0,.9)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, color: C.y, fontSize: 18, fontWeight: 900 }}>{exercise ? '✏️ עריכת תרגיל' : '+ תרגיל חדש'}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid ' + C.borderLit, color: C.muted, fontSize: 16, cursor: 'pointer', borderRadius: 6, padding: '4px 10px' }}>✕</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lS}>שם התרגיל *</label>
          <input value={form.title} onChange={e => f('title', e.target.value)} style={iS} placeholder="לדוגמה: זיהוי 1kHz" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={lS}>סוג תרגיל</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <select value={form.type} onChange={e => f('type', e.target.value)} style={{ ...iS, flex: 1 }}>
                {exTypes.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
              </select>
              <button onClick={() => setNtOpen(!ntOpen)}
                style={{ padding: '0 12px', background: ntOpen ? C.y + '22' : C.panel, color: ntOpen ? C.y : C.muted, border: '1px solid ' + (ntOpen ? C.y : C.borderLit), borderRadius: 7, cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>+</button>
            </div>
          </div>
          <div>
            <label style={lS}>רמת קושי</label>
            <select value={form.diff} onChange={e => f('diff', e.target.value)} style={iS}>
              <option>קל</option><option>בינוני</option><option>קשה</option>
            </select>
          </div>
        </div>

        {ntOpen && (
          <div style={{ marginBottom: 14, padding: 14, background: C.panel, borderRadius: 8, border: '1px dashed ' + C.y + '44' }}>
            <div style={{ fontSize: 12, color: C.y, fontWeight: 700, marginBottom: 10 }}>🆕 הוספת סוג חדש</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 58px 52px auto', gap: 8, alignItems: 'flex-end' }}>
              <div><label style={lS}>שם הסוג</label><input value={nt.label} onChange={e => setNt(n => ({ ...n, label: e.target.value }))} style={iS} placeholder="שם..." /></div>
              <div><label style={lS}>אייקון</label><input value={nt.icon} onChange={e => setNt(n => ({ ...n, icon: e.target.value }))} style={{ ...iS, textAlign: 'center', fontSize: 18 }} /></div>
              <div><label style={lS}>צבע</label><input type="color" value={nt.color} onChange={e => setNt(n => ({ ...n, color: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid ' + C.borderLit, borderRadius: 7, cursor: 'pointer', background: 'transparent', padding: 2 }} /></div>
              <button onClick={addType} style={{ padding: '9px 14px', background: C.y, color: '#000', border: 'none', borderRadius: 7, fontWeight: 800, cursor: 'pointer', fontSize: 13, height: 38, flexShrink: 0 }}>צור</button>
            </div>
          </div>
        )}

        {curType && (
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: curType.color + '14', border: '1px solid ' + curType.color + '44', borderRadius: 7 }}>
            <span style={{ fontSize: 18 }}>{curType.icon}</span>
            <span style={{ fontSize: 12, color: curType.color, fontWeight: 700 }}>{curType.label}</span>
            {isCustom && <span style={{ fontSize: 10, color: C.muted, marginRight: 'auto' }}>* תרגיל חופשי — התלמיד יקרא הוראות ויסמן ידנית</span>}
          </div>
        )}

        {/* Signal source — only for built-in training types */}
        {!isCustom && (
          <div style={{ marginBottom: 14 }}>
            <label style={lS}>מקור אות לתרגיל</label>
            <AdminSignalPicker
              exerciseType={form.type}
              signalType={form.signalType || 'auto'}
              signalConfig={form.signalConfig}
              onChange={(type, config) => setForm(x => ({ ...x, signalType: type, signalConfig: config }))}
            />
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={lS}>תיאור קצר</label>
          <input value={form.description || ''} onChange={e => f('description', e.target.value)} style={iS} placeholder="תיאור קצר..." />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={lS}>הוראות לתלמיד</label>
          <textarea value={form.instructions || ''} onChange={e => f('instructions', e.target.value)} style={{ ...iS, height: 80, resize: 'vertical' }} placeholder="הסבר מפורט..." />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={lS}>קובץ אודיו (להאזנה / הפניה)</label>
          {uploading ? (
            <div style={{ padding: '10px 14px', background: C.panel, border: '1px solid ' + C.y + '44', borderRadius: 7, color: C.y, fontSize: 12 }}>⏳ מעלה קובץ...</div>
          ) : form.audioName ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '9px 12px', background: C.panel, border: '1px solid ' + C.green + '44', borderRadius: 7 }}>
              <span style={{ fontSize: 16 }}>🎵</span>
              <span style={{ flex: 1, fontSize: 12, color: C.green, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.audioName}</span>
              <button onClick={() => setForm(x => ({ ...x, audioUrl: null, audioName: null }))} style={{ color: C.red, background: 'transparent', border: '1px solid ' + C.red, borderRadius: 4, cursor: 'pointer', fontSize: 11, padding: '2px 7px' }}>הסר</button>
            </div>
          ) : (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: C.panel, border: '1px dashed ' + C.borderLit, borderRadius: 7, cursor: 'pointer', color: C.muted, fontSize: 12 }}>
              📁 לחץ לבחירת קובץ אודיו
              <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => handleAudio(e.target.files[0])} />
            </label>
          )}
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={lS}>הערות פנימיות</label>
          <textarea value={form.notes || ''} onChange={e => f('notes', e.target.value)} style={{ ...iS, height: 52, resize: 'vertical' }} placeholder="הערות למנהל בלבד..." />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSave} disabled={!form.title}
            style={{ flex: 1, padding: 12, background: form.title ? C.y : C.yDim, color: '#000', border: 'none', borderRadius: 8, fontWeight: 900, fontSize: 14, cursor: form.title ? 'pointer' : 'not-allowed' }}>
            {exercise ? 'עדכן תרגיל' : '+ הוסף תרגיל'}
          </button>
          <button onClick={onClose} style={{ padding: '12px 20px', background: 'transparent', color: C.muted, border: '1px solid ' + C.borderLit, borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>ביטול</button>
        </div>
      </div>
    </div>
  );
}
