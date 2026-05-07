import { useState } from 'react';
import { C, iS } from '../constants.js';
import { supabase } from '../lib/supabase.js';

export default function MixerSetup({ channels, setChannels }) {
  const [uploading, setUploading] = useState({});

  const handleFile = async (idx, file) => {
    if (!file) return;
    setUploading(u => ({ ...u, [idx]: true }));
    const path = `mixer/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('audio').upload(path, file, { upsert: true });
    if (error) { alert('שגיאה בהעלאה: ' + error.message); setUploading(u => ({ ...u, [idx]: false })); return; }
    const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(path);
    setChannels(c => c.map((x, i) => i === idx ? { ...x, audioUrl: publicUrl, audioName: file.name } : x));
    setUploading(u => ({ ...u, [idx]: false }));
  };

  const clear = idx => setChannels(c => c.map((x, i) => {
    if (i !== idx) return x;
    return { ...x, audioUrl: null, audioName: null };
  }));

  const rename = (idx, name) => setChannels(c => c.map((x, i) => i === idx ? { ...x, name } : x));

  const loaded = channels.filter(c => c.audioUrl).length;

  return (
    <div>
      <div style={{ fontWeight: 700, color: C.y, marginBottom: 4, fontSize: 13 }}>🎚️ הגדרת ערוצי מיקסר — 16 ערוצים</div>
      <p style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>{loaded + ' מתוך 16 ערוצים טעונים עם אודיו'}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {channels.map((ch, i) => (
          <div key={i} style={{ background: C.card, padding: 12, borderRadius: 8, border: '1px solid ' + (i === 15 ? C.yDim : C.borderLit) }}>
            <div style={{ fontSize: 10, color: i === 15 ? C.y : C.muted, marginBottom: 5, fontWeight: 700 }}>{'ערוץ ' + (i + 1)}</div>
            <input value={ch.name} onChange={e => rename(i, e.target.value)} style={{ ...iS, marginBottom: 8, fontSize: 12, padding: '6px 8px' }} placeholder={'Ch ' + (i + 1)} />
            {uploading[i] ? (
              <div style={{ padding: '5px 8px', background: C.panel, borderRadius: 5, color: C.y, fontSize: 9, textAlign: 'center' }}>⏳ מעלה...</div>
            ) : ch.audioName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 8px', background: C.panel, borderRadius: 5, border: '1px solid ' + C.green + '44' }}>
                <span style={{ fontSize: 9, color: C.green, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.audioName}</span>
                <button onClick={() => clear(i)} style={{ color: C.red, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>✕</button>
              </div>
            ) : (
              <label style={{ display: 'block', padding: '7px 0', background: C.panel, border: '1px dashed ' + C.borderLit, borderRadius: 5, cursor: 'pointer', textAlign: 'center', fontSize: 10, color: C.muted }}>
                + העלה אודיו
                <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => handleFile(i, e.target.files[0])} />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
