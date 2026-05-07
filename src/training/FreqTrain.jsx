import { useState, useRef } from 'react';
import { C } from '../constants.js';
import { useSignalSource } from '../hooks/useSignalSource.js';

const FREQS = [63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const FLAB  = ['63Hz','125Hz','250Hz','500Hz','1kHz','2kHz','4kHz','8kHz','16kHz'];

export default function FreqTrain({ exercise, onComplete }) {
  const [phase,   setPhase]   = useState('idle');
  const [target,  setTarget]  = useState(null);
  const [choices, setChoices] = useState([]);
  const [sel,     setSel]     = useState(null);
  const [hist,    setHist]    = useState([]);
  const actx = useRef(null);

  const { sigBufRef, loading } = useSignalSource(exercise);

  const getCtx = () => {
    if (!actx.current) actx.current = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.current.state === 'suspended') actx.current.resume();
    return actx.current;
  };

  const play = freq => {
    const ctx = getCtx();
    const dur = 1.5;
    let src;
    if (sigBufRef.current) {
      const len = Math.min(sigBufRef.current.length, Math.floor(ctx.sampleRate * dur));
      const ab = ctx.createBuffer(1, len, ctx.sampleRate);
      ab.getChannelData(0).set(sigBufRef.current.slice(0, len));
      src = ctx.createBufferSource(); src.buffer = ab;
    } else {
      const ab = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const d = ab.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      src = ctx.createBufferSource(); src.buffer = ab;
    }
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 6;
    const g  = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(.55, ctx.currentTime + .05);
    g.gain.linearRampToValueAtTime(.55, ctx.currentTime + 1.2);
    g.gain.linearRampToValueAtTime(0,   ctx.currentTime + 1.5);
    src.connect(bp); bp.connect(g); g.connect(ctx.destination);
    src.start(); src.stop(ctx.currentTime + 1.5);
  };

  const newRound = () => {
    const idx = Math.floor(Math.random() * FREQS.length);
    const t   = FREQS[idx];
    const oth = FREQS.filter((_, i) => i !== idx).sort(() => Math.random() - .5).slice(0, 3);
    setTarget(t); setChoices([...oth, t].sort(() => Math.random() - .5));
    setSel(null); setPhase('playing'); play(t);
  };

  const answer = f => {
    if (phase !== 'playing') return;
    setSel(f); setPhase('answered');
    const ok = f === target;
    setHist(h => [...h, { target, sel: f, ok }]);
    if (ok && onComplete) onComplete(100);
  };

  const pct = hist.length ? Math.round(hist.filter(h => h.ok).length / hist.length * 100) : null;

  if (loading) return <div style={{ color: C.muted, fontSize: 13, padding: 24 }}>⏳ טוען אות...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 23, fontWeight: 900, color: C.y, margin: '0 0 5px' }}>🎵 זיהוי תדרים</h1>
      <p style={{ color: C.muted, margin: '0 0 18px', fontSize: 13 }}>האזן לצליל מסונן וזהה את תדר המרכז</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 18 }}>
        <div style={{ background: C.card, padding: 26, borderRadius: 12, border: '1px solid ' + C.borderLit }}>

          {phase === 'idle' && (
            <div style={{ textAlign: 'center', padding: '44px 0' }}>
              <div style={{ fontSize: 46, marginBottom: 14 }}>🎧</div>
              <button onClick={newRound} style={{ padding: '13px 44px', background: C.y, color: '#000', border: 'none', borderRadius: 8, fontWeight: 900, fontSize: 15, cursor: 'pointer' }}>▶ השמע צליל</button>
            </div>
          )}

          {(phase === 'playing' || phase === 'answered') && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
                <button onClick={() => play(target)} style={{ padding: '9px 20px', background: 'transparent', color: C.y, border: '2px solid ' + C.y, borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>🔊 שמע שוב</button>
                {phase === 'answered' && <button onClick={newRound} style={{ padding: '9px 20px', background: C.y, color: '#000', border: 'none', borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>הבא ›</button>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {choices.map(f => {
                  const isT = f === target, isS = f === sel;
                  let bg = C.panel, bc = C.borderLit, col = C.text;
                  if (phase === 'answered') {
                    if (isT) { bg = 'rgba(0,232,122,.12)'; bc = C.green; col = C.green; }
                    else if (isS) { bg = 'rgba(255,51,85,.12)'; bc = C.red; col = C.red; }
                  }
                  return (
                    <button key={f} onClick={() => answer(f)} disabled={phase === 'answered'}
                      style={{ padding: 15, background: bg, color: col, border: '2px solid ' + bc, borderRadius: 9, cursor: phase === 'playing' ? 'pointer' : 'default', fontSize: 16, fontWeight: 700 }}>
                      {FLAB[FREQS.indexOf(f)]}
                    </button>
                  );
                })}
              </div>
              {phase === 'answered' && (
                <div style={{ marginTop: 16, padding: 13, background: sel === target ? 'rgba(0,232,122,.08)' : 'rgba(255,51,85,.08)', border: '1px solid ' + (sel === target ? C.green : C.red), borderRadius: 8, textAlign: 'center', color: sel === target ? C.green : C.red, fontWeight: 700, fontSize: 14 }}>
                  {sel === target ? '✅ נכון!' : '❌ שגוי — התדר היה ' + FLAB[FREQS.indexOf(target)]}
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ background: C.card, padding: 20, borderRadius: 12, border: '1px solid ' + C.borderLit }}>
          <div style={{ fontWeight: 700, color: C.y, marginBottom: 12, fontSize: 13 }}>📊 סטטיסטיקות</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: pct != null ? C.y : C.muted }}>{pct != null ? pct + '%' : '—'}</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>דיוק כולל</div>
          {[{ l: 'נכון', v: hist.filter(h => h.ok).length, c: C.green }, { l: 'שגוי', v: hist.filter(h => !h.ok).length, c: C.red }].map(({ l, v, c }) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted, marginBottom: 6 }}>
              <span>{l}</span><span style={{ color: c, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid ' + C.dim, paddingTop: 14, marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {hist.slice(-12).reverse().map((h, i) => (
              <div key={i} style={{ width: 24, height: 24, borderRadius: 5, background: h.ok ? 'rgba(0,232,122,.15)' : 'rgba(255,51,85,.15)', border: '1px solid ' + (h.ok ? C.green : C.red), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: h.ok ? C.green : C.red }}>
                {h.ok ? '✓' : '✗'}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
