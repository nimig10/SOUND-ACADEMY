import { C, iS } from '../constants.js';

export default function MixerSetup({ channels, setChannels }) {
  const handleFile = (idx, file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setChannels(c => c.map((x, i) => i === idx ? { ...x, audioUrl: url, audioName: file.name } : x));
  };

  const clear = idx => setChannels(c => c.map((x, i) => {
    if (i !== idx) return x;
    if (x.audioUrl) URL.revokeObjectURL(x.audioUrl);
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
            {ch.audioName ? (
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
