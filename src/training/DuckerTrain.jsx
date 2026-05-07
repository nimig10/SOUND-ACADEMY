import { useState, useRef, useEffect } from 'react';
import { C } from '../constants.js';

const ROUNDS = [
  { threshold: -20, attack: 5,  release: 150, depth: 12 },
  { threshold: -15, attack: 2,  release: 80,  depth: 18 },
  { threshold: -25, attack: 10, release: 300, depth: 8  },
  { threshold: -18, attack: 1,  release: 50,  depth: 20 },
  { threshold: -22, attack: 8,  release: 200, depth: 10 },
];

const PARAMS = [
  { key: 'threshold', label: 'Threshold', unit: 'dB', min: -40, max: -5,  step: 1   },
  { key: 'attack',    label: 'Attack',    unit: 'ms', min: 0.5, max: 50,  step: 0.5 },
  { key: 'release',   label: 'Release',   unit: 'ms', min: 20,  max: 500, step: 5   },
  { key: 'depth',     label: 'Depth',     unit: 'dB', min: 0,   max: 30,  step: 1   },
];

const DEFAULT_VALS = { threshold: -10, attack: 20, release: 200, depth: 0 };

// Kick-like trigger: periodic hard transients every beat (~120 BPM)
function buildTriggerBuffer(sampleRate) {
  const dur = 4;
  const buf = new Float32Array(Math.floor(sampleRate * dur));
  const bps = 120 / 60;
  const beatSamples = Math.round(sampleRate / bps);
  for (let beat = 0; beat < dur * bps; beat++) {
    const start = Math.round(beat * beatSamples);
    for (let i = 0; i < sampleRate * 0.08; i++) {
      if (start + i >= buf.length) break;
      const t = i / sampleRate;
      buf[start + i] = Math.exp(-t * 50) * Math.sin(2 * Math.PI * 70 * t) * 0.85
                     + (Math.random() * 2 - 1) * Math.exp(-t * 80) * 0.4;
    }
  }
  return buf;
}

// Sustained pad: slow sine wave + harmonics
function buildPadBuffer(sampleRate) {
  const dur = 4;
  const buf = new Float32Array(Math.floor(sampleRate * dur));
  for (let i = 0; i < buf.length; i++) {
    const t = i / sampleRate;
    buf[i] = Math.sin(2 * Math.PI * 220 * t) * 0.35
           + Math.sin(2 * Math.PI * 330 * t) * 0.18
           + Math.sin(2 * Math.PI * 440 * t) * 0.09
           + (Math.random() * 2 - 1) * 0.02;
  }
  return buf;
}

// Offline ducker: sidechain trigger → duck pad
async function applyDucker(trigBuf, padBuf, sampleRate, vals) {
  const threshLinear  = Math.pow(10, vals.threshold / 20);
  const attackSamples  = Math.max(1, Math.round((vals.attack  / 1000) * sampleRate));
  const releaseSamples = Math.max(1, Math.round((vals.release / 1000) * sampleRate));
  const minGain        = Math.pow(10, -vals.depth / 20); // e.g. −12 dB = 0.25

  const len = Math.min(trigBuf.length, padBuf.length);
  const out = new Float32Array(len);
  let envGain = 1.0;

  for (let i = 0; i < len; i++) {
    const trigLevel = Math.abs(trigBuf[i]);
    const targetGain = trigLevel > threshLinear ? minGain : 1.0;

    if (targetGain < envGain) {
      // Duck: fast attack
      envGain += (targetGain - envGain) / attackSamples;
    } else {
      // Recover: release
      envGain += (targetGain - envGain) / releaseSamples;
    }
    // Mix: pad (ducked) + trigger (always audible)
    out[i] = padBuf[i] * envGain + trigBuf[i] * 0.5;
  }
  return out;
}

function calcScore(vals, target) {
  const diffs = PARAMS.map(({ key, min, max }) => {
    const range = max - min;
    return Math.abs(vals[key] - target[key]) / range;
  });
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  return Math.max(0, Math.round((1 - avg * 2) * 100));
}

export default function DuckerTrain({ onComplete }) {
  const [phase,    setPhase]    = useState('idle');
  const [roundIdx, setRoundIdx] = useState(0);
  const [vals,     setVals]     = useState({ ...DEFAULT_VALS });
  const [mode,     setMode]     = useState('A');
  const [hist,     setHist]     = useState([]);
  const [loading,  setLoading]  = useState(false);

  const actx    = useRef(null);
  const srcRef  = useRef(null);
  const trigBuf = useRef(null);
  const padBuf  = useRef(null);
  const valsRef = useRef(vals);
  useEffect(() => { valsRef.current = vals; }, [vals]);

  const target = ROUNDS[roundIdx % ROUNDS.length];

  const getCtx = () => {
    if (!actx.current) actx.current = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.current.state === 'suspended') actx.current.resume();
    return actx.current;
  };

  const stopSrc = () => {
    if (srcRef.current) { try { srcRef.current.stop(); } catch (_) {} srcRef.current = null; }
  };

  const playProcessed = async (targetVals) => {
    stopSrc();
    const ctx = getCtx();
    if (!trigBuf.current) trigBuf.current = buildTriggerBuffer(ctx.sampleRate);
    if (!padBuf.current)  padBuf.current  = buildPadBuffer(ctx.sampleRate);

    setLoading(true);
    const processed = await applyDucker(trigBuf.current, padBuf.current, ctx.sampleRate, targetVals);
    setLoading(false);

    const audioBuf = ctx.createBuffer(1, processed.length, ctx.sampleRate);
    audioBuf.getChannelData(0).set(processed);

    const src = ctx.createBufferSource();
    src.buffer = audioBuf;
    src.loop = true;
    src.connect(ctx.destination);
    src.start();
    srcRef.current = src;
  };

  const startRound = () => {
    setVals({ ...DEFAULT_VALS });
    setMode('A');
    setPhase('playing');
    playProcessed(target);
  };

  const toggleAB = async () => {
    const next = mode === 'A' ? 'B' : 'A';
    setMode(next);
    await playProcessed(next === 'A' ? target : valsRef.current);
  };

  const updateParam = (key, v) => {
    const next = { ...valsRef.current, [key]: v };
    setVals(next);
    valsRef.current = next;
  };

  const applyAndListen = async () => {
    setMode('B');
    await playProcessed(valsRef.current);
  };

  const submitAnswer = () => {
    stopSrc();
    const score = calcScore(vals, target);
    setHist(h => [...h, { score }]);
    setPhase('answered');
    if (onComplete) onComplete(score);
  };

  const nextRound = () => {
    setRoundIdx(r => r + 1);
    startRound();
  };

  useEffect(() => () => stopSrc(), []);

  const avgScore = hist.length ? Math.round(hist.reduce((a, b) => a + b.score, 0) / hist.length) : null;

  return (
    <div>
      <h1 style={{ fontSize: 23, fontWeight: 900, color: C.y, margin: '0 0 5px' }}>🦆 אימון Ducker</h1>
      <p style={{ color: C.muted, margin: '0 0 22px', fontSize: 13 }}>הקיק מוריד את ה-Pad — כוון את ה-Sidechain כך שישמע כמו ה-Reference</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 18 }}>
        <div style={{ background: C.card, padding: 26, borderRadius: 12, border: '1px solid ' + C.borderLit }}>

          {phase === 'idle' && (
            <div style={{ textAlign: 'center', padding: '44px 0' }}>
              <div style={{ fontSize: 46, marginBottom: 14 }}>🦆</div>
              <p style={{ color: C.muted, marginBottom: 8, fontSize: 13 }}>ה-Ducker (Sidechain Compressor) מוריד את עוצמת ה-Pad</p>
              <p style={{ color: C.muted, marginBottom: 20, fontSize: 13 }}>בכל מכה של הקיק — בהתאם לפרמטרים</p>
              <button onClick={startRound} style={{ padding: '13px 44px', background: C.y, color: '#000', border: 'none', borderRadius: 8, fontWeight: 900, fontSize: 15, cursor: 'pointer' }}>▶ התחל</button>
            </div>
          )}

          {(phase === 'playing' || phase === 'answered') && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <button onClick={toggleAB} disabled={phase === 'answered' || loading}
                  style={{ padding: '9px 24px', background: mode === 'A' ? '#4488ff' : C.y, color: '#000', border: 'none', borderRadius: 7, fontWeight: 900, fontSize: 13, cursor: 'pointer', opacity: phase === 'answered' || loading ? 0.5 : 1 }}>
                  {mode === 'A' ? '🔊 Reference (A)' : '🦆 שלך (B)'}
                </button>
                {mode === 'B' && phase === 'playing' && (
                  <button onClick={applyAndListen} disabled={loading}
                    style={{ padding: '9px 18px', background: 'transparent', color: C.blue, border: '1px solid ' + C.blue, borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    ↺ עדכן האזנה
                  </button>
                )}
                {loading && <span style={{ color: C.muted, fontSize: 11 }}>⏳ מעבד...</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {PARAMS.map(({ key, label, unit, min, max, step }) => (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: C.text }}>{label}</span>
                      <span style={{ color: C.y }}>{vals[key]}{unit}</span>
                    </div>
                    <input type="range" min={min} max={max} step={step} value={vals[key]}
                      onChange={e => updateParam(key, parseFloat(e.target.value))}
                      disabled={phase === 'answered'}
                      style={{ width: '100%', accentColor: C.y }} />
                    {phase === 'answered' && (
                      <div style={{ fontSize: 10, color: C.green, marginTop: 2 }}>
                        Target: {target[key]}{unit}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Signal diagram */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 11, color: C.muted, padding: '10px 14px', background: C.panel, borderRadius: 8, border: '1px solid ' + C.borderLit }}>
                <span style={{ color: C.y, fontWeight: 700 }}>🥁 קיק</span>
                <span>→ Sidechain →</span>
                <span style={{ color: '#4488ff', fontWeight: 700 }}>🎹 Pad</span>
                <span>→</span>
                <span style={{ color: C.green, fontWeight: 700 }}>Output</span>
                <span style={{ marginRight: 'auto' }} />
                <span>Depth: <b style={{ color: C.y }}>{vals.depth} dB</b></span>
              </div>

              {phase === 'playing' && (
                <button onClick={submitAnswer} style={{ padding: '10px 28px', background: C.green, color: '#000', border: 'none', borderRadius: 7, fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
                  ✓ שלח תשובה
                </button>
              )}

              {phase === 'answered' && (
                <>
                  <div style={{ padding: 14, marginBottom: 14, background: hist[hist.length - 1]?.score >= 70 ? 'rgba(0,232,122,.08)' : 'rgba(255,51,85,.08)', border: '1px solid ' + (hist[hist.length - 1]?.score >= 70 ? C.green : C.red), borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: hist[hist.length - 1]?.score >= 70 ? C.green : C.red }}>{hist[hist.length - 1]?.score}%</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{hist[hist.length - 1]?.score >= 70 ? '✅ כל הכבוד!' : '❌ נסה שוב בסיבוב הבא'}</div>
                  </div>
                  <button onClick={nextRound} style={{ padding: '10px 28px', background: C.y, color: '#000', border: 'none', borderRadius: 7, fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>הבא ›</button>
                </>
              )}
            </>
          )}
        </div>

        <div style={{ background: C.card, padding: 20, borderRadius: 12, border: '1px solid ' + C.borderLit }}>
          <div style={{ fontWeight: 700, color: C.y, marginBottom: 12, fontSize: 13 }}>📊 סטטיסטיקות</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: avgScore != null ? C.y : C.muted }}>{avgScore != null ? avgScore + '%' : '—'}</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>ציון ממוצע</div>
          <div style={{ borderTop: '1px solid ' + C.dim, paddingTop: 14, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {hist.slice(-12).reverse().map((h, i) => (
              <div key={i} title={'Score: ' + h.score + '%'} style={{ width: 28, height: 28, borderRadius: 5, background: h.score >= 70 ? 'rgba(0,232,122,.15)' : 'rgba(255,51,85,.15)', border: '1px solid ' + (h.score >= 70 ? C.green : C.red), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: h.score >= 70 ? C.green : C.red, fontWeight: 700 }}>
                {h.score}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: C.muted, lineHeight: 1.8 }}>
            <div>💡 <b style={{ color: C.text }}>Threshold</b> — רמת הקיק שמפעילה את ה-Ducker</div>
            <div style={{ marginTop: 6 }}>💡 <b style={{ color: C.text }}>Depth</b> — כמה dB ה-Pad יורד בכל מכה</div>
            <div style={{ marginTop: 6 }}>💡 <b style={{ color: C.text }}>Release</b> — כמה מהר ה-Pad חוזר לעוצמה מלאה</div>
            <div style={{ marginTop: 10, padding: 10, background: C.panel, borderRadius: 7, fontSize: 10, color: C.muted }}>
              <b style={{ color: C.text }}>Ducker = Sidechain Compressor</b><br />
              הקיק מחובר לכניסת הסייד-צ׳יין, כך שבכל מכה הוא דוחס את ה-Pad ויוצר את אפקט ה-"פומפינג"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
