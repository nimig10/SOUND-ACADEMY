import { useState, useRef, useEffect } from 'react';
import { C } from '../constants.js';
import { useSignalSource, parseSignalFromNotes } from '../hooks/useSignalSource.js';

const ROUNDS = [
  { threshold: -40, attack: 5,  hold: 50,  release: 100, range: 60 },
  { threshold: -30, attack: 1,  hold: 20,  release: 50,  range: 80 },
  { threshold: -50, attack: 10, hold: 100, release: 200, range: 40 },
  { threshold: -35, attack: 3,  hold: 30,  release: 80,  range: 70 },
  { threshold: -25, attack: 2,  hold: 10,  release: 30,  range: 90 },
];

const PARAMS = [
  { key: 'threshold', label: 'Threshold', unit: 'dB', min: -70, max: -10, step: 1   },
  { key: 'attack',    label: 'Attack',    unit: 'ms', min: 0.1, max: 50,  step: 0.5 },
  { key: 'hold',      label: 'Hold',      unit: 'ms', min: 0,   max: 500, step: 5   },
  { key: 'release',   label: 'Release',   unit: 'ms', min: 10,  max: 500, step: 5   },
  { key: 'range',     label: 'Range',     unit: 'dB', min: 0,   max: 90,  step: 1   },
];

const DEFAULT_VALS = { threshold: -20, attack: 10, hold: 50, release: 100, range: 40 };

// Build default bursts-with-noise signal
function buildAutoSignal(sampleRate) {
  const dur = 3;
  const buf = new Float32Array(Math.floor(sampleRate * dur));
  const burstTimes = [0.0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4];
  const burstLen   = 0.15;
  for (let i = 0; i < buf.length; i++) {
    const t = i / sampleRate;
    let val = (Math.random() * 2 - 1) * 0.04;
    for (const bt of burstTimes) {
      if (t >= bt && t < bt + burstLen) {
        val += (Math.random() * 2 - 1) * 0.7 * Math.sin((t - bt) / burstLen * Math.PI);
      }
    }
    buf[i] = val;
  }
  return buf;
}

// Add noise floor to a custom signal so the gate has something to filter
function addNoiseFloor(buf, noiseAmp = 0.04) {
  const out = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] + (Math.random() * 2 - 1) * noiseAmp;
  }
  return out;
}

async function applyGate(rawBuf, sampleRate, vals) {
  const threshLinear   = Math.pow(10, vals.threshold / 20);
  const attackSamples  = Math.max(1, Math.round((vals.attack  / 1000) * sampleRate));
  const holdSamples    = Math.max(0, Math.round((vals.hold    / 1000) * sampleRate));
  const releaseSamples = Math.max(1, Math.round((vals.release / 1000) * sampleRate));
  const rangeGain      = Math.pow(10, -vals.range / 20);

  const out = new Float32Array(rawBuf.length);
  let gateOpen = false, holdCount = 0, envGain = rangeGain;

  for (let i = 0; i < rawBuf.length; i++) {
    if (Math.abs(rawBuf[i]) > threshLinear) { gateOpen = true; holdCount = holdSamples; }
    else if (gateOpen) { if (holdCount > 0) holdCount--; else gateOpen = false; }
    const tg = gateOpen ? 1.0 : rangeGain;
    envGain += (tg - envGain) / (tg > envGain ? attackSamples : releaseSamples);
    out[i] = rawBuf[i] * envGain;
  }
  return out;
}

function calcScore(vals, target) {
  const diffs = PARAMS.map(({ key, min, max }) => Math.abs(vals[key] - target[key]) / (max - min));
  return Math.max(0, Math.round((1 - diffs.reduce((a, b) => a + b, 0) / diffs.length * 2) * 100));
}

export default function GateTrain({ exercise, onComplete }) {
  const [phase,   setPhase]   = useState('idle');
  const [roundIdx, setRoundIdx] = useState(0);
  const [vals,    setVals]    = useState({ ...DEFAULT_VALS });
  const [mode,    setMode]    = useState('A');
  const [hist,    setHist]    = useState([]);
  const [loading, setLoading] = useState(false);

  const actx    = useRef(null);
  const srcRef  = useRef(null);
  const rawBuf  = useRef(null);
  const valsRef = useRef(vals);
  useEffect(() => { valsRef.current = vals; }, [vals]);

  const { sigBufRef, loading: sigLoading } = useSignalSource(exercise);
  const { signalConfig } = parseSignalFromNotes(exercise?.notes);

  const target = signalConfig?.targetParams || ROUNDS[roundIdx % ROUNDS.length];

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
    setLoading(true);
    const processed = await applyGate(rawBuf.current, ctx.sampleRate, targetVals);
    setLoading(false);
    const audioBuf = ctx.createBuffer(1, processed.length, ctx.sampleRate);
    audioBuf.getChannelData(0).set(processed);
    const src = ctx.createBufferSource();
    src.buffer = audioBuf; src.loop = true;
    src.connect(ctx.destination); src.start();
    srcRef.current = src;
  };

  const startRound = () => {
    const ctx = getCtx();
    rawBuf.current = sigBufRef.current ?? buildAutoSignal(ctx.sampleRate);
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
    setVals(next); valsRef.current = next;
  };

  const applyAndListen = async () => { setMode('B'); await playProcessed(valsRef.current); };

  const submitAnswer = () => {
    stopSrc();
    const score = calcScore(vals, target);
    setHist(h => [...h, { score }]);
    setPhase('answered');
    if (onComplete) onComplete(score);
  };

  const nextRound = () => { setRoundIdx(r => r + 1); startRound(); };

  useEffect(() => () => stopSrc(), []);

  const avgScore = hist.length ? Math.round(hist.reduce((a, b) => a + b.score, 0) / hist.length) : null;
  const lastScore = hist[hist.length - 1]?.score;

  if (sigLoading) return <div style={{ color: C.muted, fontSize: 13, padding: 24 }}>⏳ טוען אות...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 23, fontWeight: 900, color: C.y, margin: '0 0 5px' }}>🚪 אימון Gate</h1>
      <p style={{ color: C.muted, margin: '0 0 18px', fontSize: 13 }}>כוון את ה-Gate כך שיסנן את ה-Noise Floor בין הביטים</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 18 }}>
        <div style={{ background: C.card, padding: 26, borderRadius: 12, border: '1px solid ' + C.borderLit }}>

          {phase === 'idle' && (
            <div style={{ textAlign: 'center', padding: '44px 0' }}>
              <div style={{ fontSize: 46, marginBottom: 14 }}>🚪</div>
              <p style={{ color: C.muted, marginBottom: 20, fontSize: 13 }}>האזן ל-Reference (A) — ה-Gate מנקה את הרעש בין הביטים<br />כוון את B כך שיישמע זהה</p>
              <button onClick={startRound} style={{ padding: '13px 44px', background: C.y, color: '#000', border: 'none', borderRadius: 8, fontWeight: 900, fontSize: 15, cursor: 'pointer' }}>▶ התחל</button>
            </div>
          )}

          {(phase === 'playing' || phase === 'answered') && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <button onClick={toggleAB} disabled={phase === 'answered' || loading}
                  style={{ padding: '9px 24px', background: mode === 'A' ? '#4488ff' : C.y, color: '#000', border: 'none', borderRadius: 7, fontWeight: 900, fontSize: 13, cursor: 'pointer', opacity: phase === 'answered' || loading ? 0.5 : 1 }}>
                  {mode === 'A' ? '🔊 Reference (A)' : '🚪 שלך (B)'}
                </button>
                {mode === 'B' && phase === 'playing' && (
                  <button onClick={applyAndListen} disabled={loading}
                    style={{ padding: '9px 18px', background: 'transparent', color: C.blue, border: '1px solid ' + C.blue, borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    ↺ עדכן האזנה
                  </button>
                )}
                {loading && <span style={{ color: C.muted, fontSize: 11 }}>⏳ מעבד...</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
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
                      <div style={{ fontSize: 10, color: C.green, marginTop: 2 }}>Target: {target[key]}{unit}</div>
                    )}
                  </div>
                ))}
              </div>

              {phase === 'playing' && (
                <button onClick={submitAnswer} style={{ padding: '10px 28px', background: C.green, color: '#000', border: 'none', borderRadius: 7, fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
                  ✓ שלח תשובה
                </button>
              )}

              {phase === 'answered' && (
                <>
                  <div style={{ padding: 14, marginBottom: 14, background: lastScore >= 70 ? 'rgba(0,232,122,.08)' : 'rgba(255,51,85,.08)', border: '1px solid ' + (lastScore >= 70 ? C.green : C.red), borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: lastScore >= 70 ? C.green : C.red }}>{lastScore}%</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{lastScore >= 70 ? '✅ כל הכבוד!' : '❌ נסה שוב בסיבוב הבא'}</div>
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
          <div style={{ marginTop: 16, fontSize: 11, color: C.muted, lineHeight: 1.7 }}>
            <div>💡 <b style={{ color: C.text }}>Threshold</b> — רמה מתחתיה ה-Gate סוגר</div>
            <div style={{ marginTop: 6 }}>💡 <b style={{ color: C.text }}>Hold</b> — זמן שה-Gate נשאר פתוח אחרי הירידה</div>
            <div style={{ marginTop: 6 }}>💡 <b style={{ color: C.text }}>Range</b> — כמה dB ה-Gate מנמיך כשסגור</div>
          </div>
        </div>
      </div>
    </div>
  );
}
