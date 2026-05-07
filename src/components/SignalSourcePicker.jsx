import { useState, useRef } from 'react';
import { C, iS } from '../constants.js';

const WAVE_OPTS = [
  { id: 'sine',     label: 'סינוס',        icon: '∿' },
  { id: 'square',   label: 'מרובע',        icon: '⊓' },
  { id: 'sawtooth', label: 'משורת',        icon: '⋀' },
  { id: 'triangle', label: 'משולש',        icon: '△' },
  { id: 'white',    label: 'White Noise',  icon: '░' },
  { id: 'pink',     label: 'Pink Noise',   icon: '▒' },
];

// ── signal builders ──────────────────────────────────────────────

async function buildOscBuffer(sampleRate, waveType, freq, dur) {
  const len = Math.floor(sampleRate * dur);
  if (waveType === 'white') {
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) buf[i] = (Math.random() * 2 - 1) * 0.6;
    return buf;
  }
  if (waveType === 'pink') {
    const buf = new Float32Array(len);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886*b0 + w*0.0555179; b1 = 0.99332*b1 + w*0.0750759;
      b2 = 0.96900*b2 + w*0.1538520; b3 = 0.86650*b3 + w*0.3104856;
      b4 = 0.55000*b4 + w*0.5329522; b5 = -0.7616*b5 - w*0.0168980;
      buf[i] = (b0+b1+b2+b3+b4+b5+b6 + w*0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    return buf;
  }
  // tonal wave via OfflineAudioContext
  const offline = new OfflineAudioContext(1, len, sampleRate);
  const osc = offline.createOscillator();
  osc.type = waveType;
  osc.frequency.value = freq;
  const g = offline.createGain();
  g.gain.setValueAtTime(0, 0);
  g.gain.linearRampToValueAtTime(0.65, 0.02);
  g.gain.linearRampToValueAtTime(0.65, dur - 0.02);
  g.gain.linearRampToValueAtTime(0, dur);
  osc.connect(g); g.connect(offline.destination);
  osc.start(); osc.stop(dur);
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0).slice();
}

async function decodeFileBuffer(file, sampleRate, dur = 4) {
  const arrayBuf = await file.arrayBuffer();
  const tmpCtx = new OfflineAudioContext(1, 1, sampleRate);
  const decoded = await tmpCtx.decodeAudioData(arrayBuf);
  const maxLen = Math.floor(sampleRate * dur);
  const len = Math.min(decoded.length, maxLen);
  const out = new Float32Array(len);
  for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
    const data = decoded.getChannelData(ch);
    for (let i = 0; i < len; i++) out[i] += data[i] / decoded.numberOfChannels;
  }
  return out;
}

// ── component ────────────────────────────────────────────────────

export default function SignalSourcePicker({ sampleRate = 44100, onReady, systemLabel = 'אות אוטומטי' }) {
  const [tab,      setTab]      = useState('system');
  const [wave,     setWave]     = useState('sine');
  const [freq,     setFreq]     = useState(220);
  const [fileName, setFileName] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState(null);
  const fileRef = useRef(null);

  const handleFile = e => {
    const f = e.target.files?.[0];
    if (f) setFileName(f.name);
  };

  const confirm = async () => {
    setErr(null);
    setLoading(true);
    try {
      if (tab === 'system') {
        onReady(null); // null = use built-in generator
      } else if (tab === 'osc') {
        const buf = await buildOscBuffer(sampleRate, wave, freq, 4);
        onReady(buf);
      } else if (tab === 'file') {
        const file = fileRef.current?.files?.[0];
        if (!file) { setErr('בחר קובץ אודיו'); setLoading(false); return; }
        const buf = await decodeFileBuffer(file, sampleRate);
        onReady(buf);
      }
    } catch (e) {
      setErr('שגיאה: ' + e.message);
    }
    setLoading(false);
  };

  const tabBtn = (id, icon, label) => (
    <button key={id} onClick={() => setTab(id)} style={{
      flex: 1, padding: '9px 6px', background: tab === id ? C.y : C.panel,
      color: tab === id ? '#000' : C.muted, border: '1px solid ' + (tab === id ? C.y : C.borderLit),
      borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: 12, transition: 'all .15s',
    }}>{icon} {label}</button>
  );

  return (
    <div style={{ background: C.card, border: '1px solid ' + C.borderLit, borderRadius: 12, padding: 22, marginBottom: 22 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.y, marginBottom: 14 }}>🎯 בחר מקור אות (Target Signal)</div>

      <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
        {tabBtn('system', '🎲', 'אוטומטי')}
        {tabBtn('osc',    '🎛️', 'אוסצילטור')}
        {tabBtn('file',   '📁', 'קובץ')}
      </div>

      {tab === 'system' && (
        <div style={{ padding: '14px 16px', background: C.panel, borderRadius: 8, fontSize: 12, color: C.muted }}>
          <div style={{ color: C.text, fontWeight: 700, marginBottom: 6 }}>🎲 {systemLabel}</div>
          המערכת תיצור אות מוכן-מראש המתאים לסוג התרגיל — מושלם להתחלה
        </div>
      )}

      {tab === 'osc' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7, marginBottom: 14 }}>
            {WAVE_OPTS.map(w => (
              <button key={w.id} onClick={() => setWave(w.id)} style={{
                padding: '10px 6px', background: wave === w.id ? 'rgba(255,215,0,.12)' : C.panel,
                border: '1px solid ' + (wave === w.id ? C.y : C.borderLit), borderRadius: 7,
                cursor: 'pointer', color: wave === w.id ? C.y : C.muted,
                fontSize: 12, fontWeight: 700,
              }}>
                <div style={{ fontSize: 18, marginBottom: 3 }}>{w.icon}</div>
                {w.label}
              </button>
            ))}
          </div>
          {!['white', 'pink'].includes(wave) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>תדר:</span>
              <input type="range" min={40} max={4000} step={10} value={freq}
                onChange={e => setFreq(+e.target.value)}
                style={{ flex: 1, accentColor: C.y }} />
              <span style={{ fontSize: 12, color: C.y, minWidth: 55, textAlign: 'left' }}>{freq} Hz</span>
            </div>
          )}
        </div>
      )}

      {tab === 'file' && (
        <div>
          <label style={{ display: 'block', padding: '20px', background: C.panel, border: '1px dashed ' + C.borderLit, borderRadius: 8, cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
            <div style={{ fontSize: 12, color: fileName ? C.green : C.muted, fontWeight: fileName ? 700 : 400 }}>
              {fileName || '+ העלה קובץ אודיו (mp3, wav, ogg...)'}
            </div>
            <input ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleFile} />
          </label>
          {fileName && (
            <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
              ⚠️ ישתמש ב-4 שניות ראשונות מהקובץ
            </div>
          )}
        </div>
      )}

      {err && <div style={{ color: C.red, fontSize: 12, marginTop: 10 }}>{err}</div>}

      <button onClick={confirm} disabled={loading} style={{
        marginTop: 18, width: '100%', padding: '11px', background: loading ? C.dim : C.y,
        color: '#000', border: 'none', borderRadius: 8, fontWeight: 900, fontSize: 14,
        cursor: loading ? 'default' : 'pointer',
      }}>
        {loading ? '⏳ טוען...' : '▶ התחל תרגיל'}
      </button>
    </div>
  );
}

export { buildOscBuffer, decodeFileBuffer };
