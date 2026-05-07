import { useState, useRef, useEffect } from 'react';
import { C } from '../constants.js';

const ROUNDS = [
  { threshold: -24, ratio: 4,  attack: 10,  release: 150, knee: 6,  makeup: 6  },
  { threshold: -18, ratio: 8,  attack: 5,   release: 80,  knee: 3,  makeup: 8  },
  { threshold: -30, ratio: 2,  attack: 30,  release: 300, knee: 10, makeup: 4  },
  { threshold: -12, ratio: 20, attack: 1,   release: 50,  knee: 0,  makeup: 12 },
  { threshold: -20, ratio: 6,  attack: 15,  release: 200, knee: 5,  makeup: 7  },
];

const PARAMS = [
  { key: 'threshold', label: 'Threshold', unit: 'dB', min: -60, max: 0,   step: 1  },
  { key: 'ratio',     label: 'Ratio',     unit: ':1', min: 1,   max: 20,  step: 0.5 },
  { key: 'attack',    label: 'Attack',    unit: 'ms', min: 0,   max: 100, step: 1  },
  { key: 'release',   label: 'Release',   unit: 'ms', min: 10,  max: 500, step: 5  },
  { key: 'knee',      label: 'Knee',      unit: 'dB', min: 0,   max: 20,  step: 1  },
  { key: 'makeup',    label: 'Makeup',    unit: 'dB', min: 0,   max: 24,  step: 0.5 },
];

const DEFAULT_VALS = { threshold: -12, ratio: 1, attack: 50, release: 250, knee: 10, makeup: 0 };

function makeNoise(ctx, dur = 2.5) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const d = buf.getChannelData(0);
  // Drum-like transients + sustained noise for a realistic mix bus signal
  for (let i = 0; i < d.length; i++) {
    const t = i / ctx.sampleRate;
    const kick = Math.exp(-t * 30) * Math.sin(2 * Math.PI * 80 * t) * 0.9;
    const snare = (Math.random() * 2 - 1) * Math.exp(-((t - 0.5) % 1) * 40) * 0.6;
    d[i] = kick + snare + (Math.random() * 2 - 1) * 0.12;
  }
  return buf;
}

function applyParams(comp, vals) {
  comp.threshold.value = vals.threshold;
  comp.ratio.value = vals.ratio;
  comp.attack.value = vals.attack / 1000;
  comp.release.value = vals.release / 1000;
  comp.knee.value = vals.knee;
}

function calcScore(vals, target) {
  const diffs = PARAMS.map(({ key, min, max }) => {
    const range = max - min;
    return Math.abs(vals[key] - target[key]) / range;
  });
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  return Math.max(0, Math.round((1 - avg * 2) * 100));
}

export default function CompressorTrain({ onComplete }) {
  const [phase,    setPhase]    = useState('idle');
  const [roundIdx, setRoundIdx] = useState(0);
  const [vals,     setVals]     = useState({ ...DEFAULT_VALS });
  const [mode,     setMode]     = useState('A'); // A = target, B = user
  const [hist,     setHist]     = useState([]);
  const [grLevel,  setGrLevel]  = useState(0);

  const actx     = useRef(null);
  const compRef  = useRef(null);
  const makeupRef = useRef(null);
  const srcRef   = useRef(null);
  const grTimer  = useRef(null);
  const valsRef  = useRef(vals);
  useEffect(() => { valsRef.current = vals; }, [vals]);

  const target = ROUNDS[roundIdx % ROUNDS.length];

  const getCtx = () => {
    if (!actx.current) actx.current = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.current.state === 'suspended') actx.current.resume();
    return actx.current;
  };

  const stopSrc = () => {
    if (srcRef.current) { try { srcRef.current.stop(); } catch (_) {} srcRef.current = null; }
    if (grTimer.current) { clearInterval(grTimer.current); grTimer.current = null; }
  };

  const playWith = (useTarget) => {
    stopSrc();
    const ctx = getCtx();
    const buf = makeNoise(ctx);
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const comp = ctx.createDynamicsCompressor();
    const mg   = ctx.createGain();

    const p = useTarget ? target : valsRef.current;
    applyParams(comp, p);
    mg.gain.value = Math.pow(10, p.makeup / 20);

    src.connect(comp); comp.connect(mg); mg.connect(ctx.destination);
    src.start();

    srcRef.current = src;
    compRef.current = comp;
    makeupRef.current = mg;

    grTimer.current = setInterval(() => {
      if (compRef.current) setGrLevel(-compRef.current.reduction);
    }, 60);
  };

  const startRound = () => {
    setVals({ ...DEFAULT_VALS });
    setMode('A');
    setPhase('playing');
    playWith(true);
  };

  const toggleAB = () => {
    const next = mode === 'A' ? 'B' : 'A';
    setMode(next);
    playWith(next === 'A');
  };

  const updateParam = (key, v) => {
    const next = { ...valsRef.current, [key]: v };
    setVals(next);
    valsRef.current = next;
    if (mode === 'B' && compRef.current) {
      applyParams(compRef.current, next);
      if (makeupRef.current) makeupRef.current.gain.value = Math.pow(10, next.makeup / 20);
    }
  };

  const submitAnswer = () => {
    stopSrc();
    const score = calcScore(vals, target);
    setHist(h => [...h, { score, vals: { ...vals }, target: { ...target } }]);
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
      <h1 style={{ fontSize: 23, fontWeight: 900, color: C.y, margin: '0 0 5px' }}>🗜️ אימון קומפרסור</h1>
      <p style={{ color: C.muted, margin: '0 0 22px', fontSize: 13 }}>התאם את הקומפרסור לצליל ה-Reference (A)</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 18 }}>
        <div style={{ background: C.card, padding: 26, borderRadius: 12, border: '1px solid ' + C.borderLit }}>

          {phase === 'idle' && (
            <div style={{ textAlign: 'center', padding: '44px 0' }}>
              <div style={{ fontSize: 46, marginBottom: 14 }}>🗜️</div>
              <p style={{ color: C.muted, marginBottom: 20, fontSize: 13 }}>האזן ל-Reference (A), ואז כוון את הפרמטרים בצד B כך שהצלילים יהיו זהים</p>
              <button onClick={startRound} style={{ padding: '13px 44px', background: C.y, color: '#000', border: 'none', borderRadius: 8, fontWeight: 900, fontSize: 15, cursor: 'pointer' }}>▶ התחל</button>
            </div>
          )}

          {(phase === 'playing' || phase === 'answered') && (
            <>
              {/* A/B toggle + GR meter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button onClick={toggleAB} disabled={phase === 'answered'} style={{ padding: '9px 28px', background: mode === 'A' ? '#4488ff' : C.y, color: '#000', border: 'none', borderRadius: 7, fontWeight: 900, fontSize: 14, cursor: 'pointer', opacity: phase === 'answered' ? 0.5 : 1 }}>
                  {mode === 'A' ? '🔊 Reference (A)' : '🎚️ שלך (B)'}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.muted }}>
                  <span>GR:</span>
                  <div style={{ width: 80, height: 8, background: '#111', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: Math.min(grLevel * 3, 80) + 'px', background: grLevel > 10 ? C.red : grLevel > 4 ? C.y : C.green, transition: 'width 60ms' }} />
                  </div>
                  <span style={{ color: C.y, minWidth: 36 }}>−{grLevel.toFixed(1)} dB</span>
                </div>
              </div>

              {/* Parameter sliders */}
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
                      <div style={{ fontSize: 10, color: C.green, marginTop: 2 }}>
                        Target: {target[key]}{unit}
                      </div>
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

        {/* Stats panel */}
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
            <div>💡 <b style={{ color: C.text }}>Threshold</b> — רמת הכניסה בה הקומפרסור מתחיל לעבוד</div>
            <div style={{ marginTop: 6 }}>💡 <b style={{ color: C.text }}>Ratio</b> — כמה הדחיסה מצמצמת את הדינמיקה</div>
            <div style={{ marginTop: 6 }}>💡 <b style={{ color: C.text }}>Attack/Release</b> — מהירות תגובת הקומפרסור</div>
          </div>
        </div>
      </div>
    </div>
  );
}
