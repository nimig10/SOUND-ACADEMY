import { useState, useRef, useEffect } from 'react';
import { C } from '../constants.js';
import { useSignalSource, parseSignalFromNotes } from '../hooks/useSignalSource.js';

const EQ_TR_BANDS = [
  { f: 80,    l: '80Hz'  },
  { f: 200,   l: '200Hz' },
  { f: 500,   l: '500Hz' },
  { f: 1000,  l: '1kHz'  },
  { f: 2500,  l: '2.5k'  },
  { f: 5000,  l: '5kHz'  },
  { f: 10000, l: '10kHz' },
  { f: 16000, l: '16kHz' },
];

export default function EQTrain({ exercise, onComplete }) {
  const [tgt,   setTgt]   = useState(EQ_TR_BANDS.map(() => 0));
  const [usr,   setUsr]   = useState(EQ_TR_BANDS.map(() => 0));
  const [phase, setPhase] = useState('idle');
  const [res,   setRes]   = useState(null);
  const actx   = useRef(null);
  const srcRef = useRef(null);

  const { sigBufRef, loading } = useSignalSource(exercise);
  const { signalConfig } = parseSignalFromNotes(exercise?.notes);

  const getCtx = () => {
    if (!actx.current) actx.current = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.current.state === 'suspended') actx.current.resume();
    return actx.current;
  };

  const stop = () => { try { srcRef.current?.stop(); } catch (e) {} srcRef.current = null; };

  const playEQ = bands => {
    stop();
    const ctx = getCtx();
    let src;
    if (sigBufRef.current) {
      const ab = ctx.createBuffer(1, sigBufRef.current.length, ctx.sampleRate);
      ab.getChannelData(0).set(sigBufRef.current);
      src = ctx.createBufferSource(); src.buffer = ab; src.loop = true;
    } else {
      const ab = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = ab.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * .22;
      src = ctx.createBufferSource(); src.buffer = ab; src.loop = true;
    }
    let prev = src;
    EQ_TR_BANDS.forEach((b, i) => {
      const f = ctx.createBiquadFilter(); f.type = 'peaking'; f.frequency.value = b.f; f.Q.value = 1.4; f.gain.value = bands[i];
      prev.connect(f); prev = f;
    });
    const g = ctx.createGain(); g.gain.value = .55;
    prev.connect(g); g.connect(ctx.destination);
    src.start(); srcRef.current = src;
  };

  const newRound = () => {
    const preset = signalConfig?.targetParams?.bands;
    const t = preset ? [...preset] : EQ_TR_BANDS.map(() => Math.random() > .45 ? (Math.random() * 18 - 9) : 0);
    setTgt(t); setUsr(EQ_TR_BANDS.map(() => 0)); setPhase('ready'); setRes(null);
    setTimeout(() => playEQ(t), 100);
  };

  const submit = () => {
    const diffs = tgt.map((t, i) => Math.abs(t - usr[i]));
    const sc = Math.max(0, Math.round(100 - diffs.reduce((a, b) => a + b, 0) / diffs.length * 5));
    setRes(sc); setPhase('done');
    if (onComplete) onComplete(sc);
  };

  useEffect(() => () => stop(), []);

  const W = 460, H = 130;
  const toY = g => H / 2 - (g / 12) * (H / 2 - 12);
  const toX = i => 24 + (i / (EQ_TR_BANDS.length - 1)) * (W - 48);

  if (loading) return <div style={{ color: C.muted, fontSize: 13, padding: 24 }}>⏳ טוען אות...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 23, fontWeight: 900, color: C.y, margin: '0 0 5px' }}>📈 אימון EQ</h1>
      <p style={{ color: C.muted, margin: '0 0 18px', fontSize: 13 }}>האזן לטרגט וכוון את ה-EQ להתאמה</p>

      <div style={{ background: C.card, padding: 24, borderRadius: 12, border: '1px solid ' + C.borderLit }}>
        <svg width="100%" viewBox={'0 0 ' + W + ' ' + H} style={{ background: '#090909', borderRadius: 8, border: '1px solid ' + C.dim, marginBottom: 18, display: 'block' }}>
          {[-12, -6, 0, 6, 12].map(g => <line key={g} x1="0" y1={toY(g)} x2={W} y2={toY(g)} stroke={g === 0 ? C.borderLit : C.border} strokeWidth={g === 0 ? 1.5 : 1} />)}
          {EQ_TR_BANDS.map((_, i) => <line key={i} x1={toX(i)} y1="0" x2={toX(i)} y2={H} stroke={C.border} strokeWidth="1" />)}
          {EQ_TR_BANDS.map((b, i) => <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fill={C.muted} fontSize="8">{b.l}</text>)}
          {phase !== 'idle' && <path d={'M ' + tgt.map((g, i) => toX(i) + ',' + toY(g)).join(' L ')} fill="none" stroke="rgba(255,215,0,.55)" strokeWidth="2" strokeDasharray="6,4" />}
          <path d={'M ' + usr.map((g, i) => toX(i) + ',' + toY(g)).join(' L ')} fill="none" stroke={C.blue} strokeWidth="2.5" />
        </svg>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + EQ_TR_BANDS.length + ',1fr)', gap: 4, marginBottom: 20 }}>
          {EQ_TR_BANDS.map((b, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: 9, color: C.blue, height: 14 }}>{usr[i] > 0 ? '+' : ''}{usr[i].toFixed(1)}</span>
              <div style={{ position: 'relative', width: 24, height: 76 }}>
                <input type="range" min="-12" max="12" step=".5" value={usr[i]}
                  onChange={e => { const v = parseFloat(e.target.value); setUsr(u => { const n = [...u]; n[i] = v; return n; }); }}
                  style={{ position: 'absolute', width: 76, height: 24, top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(90deg)', accentColor: C.blue, cursor: 'pointer' }} />
              </div>
              <span style={{ fontSize: 8, color: C.muted }}>{b.l}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          <button onClick={newRound} style={{ padding: '9px 20px', background: C.y, color: '#000', border: 'none', borderRadius: 7, fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>🎲 תרגיל חדש</button>
          <button onClick={() => phase !== 'idle' && playEQ(tgt)} disabled={phase === 'idle'} style={{ padding: '9px 18px', background: 'transparent', color: phase === 'idle' ? C.dim : C.y, border: '2px solid ' + (phase === 'idle' ? C.dim : C.y), borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>🔊 טרגט</button>
          <button onClick={() => phase !== 'idle' && playEQ(usr)} disabled={phase === 'idle'} style={{ padding: '9px 18px', background: 'transparent', color: phase === 'idle' ? C.dim : C.blue, border: '2px solid ' + (phase === 'idle' ? C.dim : C.blue), borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>🔊 שלי</button>
          <button onClick={submit} disabled={phase === 'idle' || phase === 'done'} style={{ padding: '9px 18px', background: phase === 'idle' || phase === 'done' ? C.yDim : C.green, color: '#000', border: 'none', borderRadius: 7, fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>✓ בדוק</button>
          <button onClick={stop} style={{ padding: '9px 14px', background: 'transparent', color: C.red, border: '2px solid ' + C.red, borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>■</button>
        </div>

        {res != null && (
          <div style={{ marginTop: 16, padding: 16, background: res > 70 ? 'rgba(0,232,122,.08)' : 'rgba(255,215,0,.08)', border: '1px solid ' + (res > 70 ? C.green : C.y), borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: res > 70 ? C.green : C.y }}>{res + '/100'}</div>
            <div style={{ color: C.muted, marginTop: 3, fontSize: 13 }}>{res > 70 ? '🎯 מדויק!' : '💪 תמשיך!'}</div>
          </div>
        )}
      </div>
    </div>
  );
}
