import { useState, useRef } from 'react';
import { C } from '../constants.js';
import { supabase } from '../lib/supabase.js';
import AdminEffectPreview from './AdminEffectPreview.jsx';

const WAVE_OPTS = [
  { id: 'sine',     label: 'סינוס',       icon: '∿' },
  { id: 'square',   label: 'מרובע',       icon: '⊓' },
  { id: 'sawtooth', label: 'משורת',       icon: '⋀' },
  { id: 'triangle', label: 'משולש',       icon: '△' },
  { id: 'white',    label: 'White Noise', icon: '░' },
  { id: 'pink',     label: 'Pink Noise',  icon: '▒' },
];

// Props:
//   exerciseType: 'compressor' | 'gate' | 'ducker' | 'eq' | ...
//   signalType:   'auto' | 'osc' | 'file'
//   signalConfig: null | { wave, freq } | { url, name, targetParams? }
//   onChange(type, config): called on every change
export default function AdminSignalPicker({ exerciseType, signalType = 'auto', signalConfig = null, onChange }) {
  const [uploading, setUploading] = useState(false);
  const wave = signalConfig?.wave || 'sine';
  const freq = signalConfig?.freq || 440;

  const setTab = tab => {
    if (tab === 'auto') onChange('auto', null);
    else if (tab === 'osc') onChange('osc', { wave, freq });
    else onChange('file', signalConfig?.url ? signalConfig : null);
  };

  const setWave = w => onChange('osc', { wave: w, freq });
  const setFreq = f => onChange('osc', { wave, freq: f });

  const handleFile = async file => {
    if (!file) return;
    setUploading(true);
    const path = `signal_audio/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('audio').upload(path, file, { upsert: true });
    if (error) { alert('שגיאה בהעלאה: ' + error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(path);
    onChange('file', { url: publicUrl, name: file.name });
    setUploading(false);
  };

  const tabBtn = (id, icon, label) => (
    <button key={id} onClick={() => setTab(id)} style={{
      flex: 1, padding: '8px 6px',
      background: signalType === id ? C.y : C.panel,
      color: signalType === id ? '#000' : C.muted,
      border: '1px solid ' + (signalType === id ? C.y : C.borderLit),
      borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 11,
    }}>{icon} {label}</button>
  );

  return (
    <div style={{ padding: 14, background: C.panel, borderRadius: 8, border: '1px solid ' + C.borderLit }}>
      <div style={{ fontSize: 10, color: C.muted, marginBottom: 10, letterSpacing: .5 }}>מקור אות לתרגיל (לתלמיד)</div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {tabBtn('auto', '🎲', 'אוטומטי')}
        {tabBtn('osc',  '🎛️', 'OSC')}
        {tabBtn('file', '📁', 'קובץ')}
      </div>

      {signalType === 'auto' && (
        <div style={{ fontSize: 11, color: C.muted }}>האות ייוצר אוטומטית בהתאם לסוג התרגיל</div>
      )}

      {signalType === 'osc' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5, marginBottom: 10 }}>
            {WAVE_OPTS.map(w => (
              <button key={w.id} onClick={() => setWave(w.id)} style={{
                padding: '7px 4px',
                background: wave === w.id ? 'rgba(255,215,0,.12)' : C.card,
                border: '1px solid ' + (wave === w.id ? C.y : C.borderLit),
                borderRadius: 6, cursor: 'pointer',
                color: wave === w.id ? C.y : C.muted, fontSize: 11, fontWeight: 700,
              }}>
                <div style={{ fontSize: 15, marginBottom: 2 }}>{w.icon}</div>
                {w.label}
              </button>
            ))}
          </div>
          {!['white', 'pink'].includes(wave) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>תדר:</span>
              <input type="range" min={40} max={4000} step={10} value={freq}
                onChange={e => setFreq(+e.target.value)}
                style={{ flex: 1, accentColor: C.y }} />
              <span style={{ fontSize: 11, color: C.y, minWidth: 50, textAlign: 'left' }}>{freq} Hz</span>
            </div>
          )}
        </div>
      )}

      {signalType === 'file' && (
        uploading ? (
          <div style={{ fontSize: 11, color: C.y }}>⏳ מעלה קובץ...</div>
        ) : signalConfig?.name ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: C.green, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🎵 {signalConfig.name}</span>
              {signalConfig.targetParams && <span style={{ fontSize: 10, color: C.y, flexShrink: 0 }}>✓ טרגט מוגדר</span>}
              <button onClick={() => onChange('file', null)} style={{ color: C.red, background: 'transparent', border: '1px solid ' + C.red, borderRadius: 4, cursor: 'pointer', fontSize: 10, padding: '2px 6px' }}>הסר</button>
            </div>
            <AdminEffectPreview
              exerciseType={exerciseType}
              fileUrl={signalConfig.url}
              targetParams={signalConfig.targetParams}
              onSetTarget={tp => onChange('file', { ...signalConfig, targetParams: tp })}
            />
          </>
        ) : (
          <label style={{ display: 'block', padding: '10px', background: C.card, border: '1px dashed ' + C.borderLit, borderRadius: 6, cursor: 'pointer', textAlign: 'center', fontSize: 11, color: C.muted }}>
            + בחר קובץ אודיו (mp3, wav, ogg)
            <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          </label>
        )
      )}
    </div>
  );
}
