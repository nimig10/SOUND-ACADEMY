import { useState, useRef, useEffect } from 'react';
import { C } from '../constants.js';

// ── per-type param definitions ───────────────────────────────────
const PARAMS_BY_TYPE = {
  compressor: [
    { key: 'threshold', label: 'Threshold', unit: 'dB', min: -60, max: 0,   step: 1,   def: -24 },
    { key: 'ratio',     label: 'Ratio',     unit: ':1', min: 1,   max: 20,  step: 0.5, def: 4   },
    { key: 'attack',    label: 'Attack',    unit: 'ms', min: 0,   max: 100, step: 1,   def: 10  },
    { key: 'release',   label: 'Release',   unit: 'ms', min: 10,  max: 500, step: 5,   def: 150 },
    { key: 'knee',      label: 'Knee',      unit: 'dB', min: 0,   max: 20,  step: 1,   def: 6   },
    { key: 'makeup',    label: 'Makeup',    unit: 'dB', min: 0,   max: 24,  step: 0.5, def: 6   },
  ],
  gate: [
    { key: 'threshold', label: 'Threshold', unit: 'dB', min: -70, max: -10, step: 1,   def: -40 },
    { key: 'attack',    label: 'Attack',    unit: 'ms', min: 0.1, max: 50,  step: 0.5, def: 5   },
    { key: 'hold',      label: 'Hold',      unit: 'ms', min: 0,   max: 500, step: 5,   def: 50  },
    { key: 'release',   label: 'Release',   unit: 'ms', min: 10,  max: 500, step: 5,   def: 100 },
    { key: 'range',     label: 'Range',     unit: 'dB', min: 0,   max: 90,  step: 1,   def: 60  },
  ],
  ducker: [
    { key: 'threshold', label: 'Threshold', unit: 'dB', min: -40, max: -5,  step: 1,   def: -20 },
    { key: 'attack',    label: 'Attack',    unit: 'ms', min: 0.5, max: 50,  step: 0.5, def: 5   },
    { key: 'release',   label: 'Release',   unit: 'ms', min: 20,  max: 500, step: 5,   def: 150 },
    { key: 'depth',     label: 'Depth',     unit: 'dB', min: 0,   max: 30,  step: 1,   def: 12  },
  ],
};

const EQ_BANDS = [
  { f: 80,    l: '80Hz'  },
  { f: 200,   l: '200Hz' },
  { f: 500,   l: '500Hz' },
  { f: 1000,  l: '1kHz'  },
  { f: 2500,  l: '2.5k'  },
  { f: 5000,  l: '5kHz'  },
  { f: 10000, l: '10k'   },
  { f: 16000, l: '16kHz' },
];

// ── offline DSP helpers ──────────────────────────────────────────
function buildKickBuffer(sampleRate) {
  const dur = 4;
  const buf = new Float32Array(Math.floor(sampleRate * dur));
  const beatSamples = Math.round(sampleRate / 2); // 120 BPM
  for (let beat = 0; beat < dur * 2; beat++) {
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

function addNoise(buf, amp = 0.04) {
  const out = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) out[i] = buf[i] + (Math.random() * 2 - 1) * amp;
  return out;
}

async function processGate(rawBuf, sampleRate, vals) {
  const threshLin  = Math.pow(10, vals.threshold / 20);
  const atkS       = Math.max(1, Math.round((vals.attack  / 1000) * sampleRate));
  const holdS      = Math.max(0, Math.round((vals.hold    / 1000) * sampleRate));
  const relS       = Math.max(1, Math.round((vals.release / 1000) * sampleRate));
  const rangeGain  = Math.pow(10, -vals.range / 20);
  const out = new Float32Array(rawBuf.length);
  let open = false, holdCnt = 0, env = rangeGain;
  for (let i = 0; i < rawBuf.length; i++) {
    if (Math.abs(rawBuf[i]) > threshLin) { open = true; holdCnt = holdS; }
    else if (open) { if (holdCnt > 0) holdCnt--; else open = false; }
    const tg = open ? 1.0 : rangeGain;
    env += (tg - env) / (tg > env ? atkS : relS);
    out[i] = rawBuf[i] * env;
  }
  return out;
}

async function processDucker(trigBuf, padBuf, sampleRate, vals) {
  const threshLin  = Math.pow(10, vals.threshold / 20);
  const atkS       = Math.max(1, Math.round((vals.attack  / 1000) * sampleRate));
  const relS       = Math.max(1, Math.round((vals.release / 1000) * sampleRate));
  const minGain    = Math.pow(10, -vals.depth / 20);
  const len = Math.min(trigBuf.length, padBuf.length);
  const out = new Float32Array(len);
  let env = 1.0;
  for (let i = 0; i < len; i++) {
    const tg = Math.abs(trigBuf[i]) > threshLin ? minGain : 1.0;
    env += (tg - env) / (tg < env ? atkS : relS);
    out[i] = padBuf[i] * env + trigBuf[i] * 0.5;
  }
  return out;
}

// ── component ────────────────────────────────────────────────────
export default function AdminEffectPreview({ exerciseType, fileUrl, targetParams, onSetTarget }) {
  const paramsConfig = PARAMS_BY_TYPE[exerciseType];
  const isEQ = exerciseType === 'eq';
  if (!paramsConfig && !isEQ) return null;

  const initParams = () => {
    if (isEQ) return targetParams?.bands ? [...targetParams.bands] : EQ_BANDS.map(() => 0);
    const p = {};
    paramsConfig.forEach(({ key, def }) => { p[key] = targetParams?.[key] ?? def; });
    return p;
  };

  const [params,     setParams]     = useState(initParams);
  const [rawBuf,     setRawBuf]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [playing,    setPlaying]    = useState(false);
  const [processing, setProcessing] = useState(false);

  const actxRef    = useRef(null);
  const srcRef     = useRef(null);
  const compRef    = useRef(null);
  const makeupRef  = useRef(null);
  const filtersRef = useRef([]);

  const getCtx = () => {
    if (!actxRef.current) actxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (actxRef.current.state === 'suspended') actxRef.current.resume();
    return actxRef.current;
  };

  const stopPlayback = () => {
    if (srcRef.current) { try { srcRef.current.stop(); } catch (_) {} srcRef.current = null; }
    setPlaying(false);
  };

  // Decode file to mono Float32Array on mount / url change
  useEffect(() => {
    if (!fileUrl) return;
    setLoading(true);
    const ctx = getCtx();
    fetch(fileUrl)
      .then(r => r.arrayBuffer())
      .then(ab => ctx.decodeAudioData(ab))
      .then(decoded => {
        const maxLen = Math.floor(ctx.sampleRate * 8);
        const len    = Math.min(decoded.length, maxLen);
        const mono   = new Float32Array(len);
        for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
          const d = decoded.getChannelData(ch);
          for (let i = 0; i < len; i++) mono[i] += d[i] / decoded.numberOfChannels;
        }
        setRawBuf(mono);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => stopPlayback();
  }, [fileUrl]); // eslint-disable-line

  // ── playback functions ──────────────────────────────────────────
  const playCompressor = (p) => {
    stopPlayback();
    const ctx = getCtx();
    const ab  = ctx.createBuffer(1, rawBuf.length, ctx.sampleRate);
    ab.getChannelData(0).set(rawBuf);
    const src  = ctx.createBufferSource(); src.buffer = ab; src.loop = true;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = p.threshold;
    comp.ratio.value     = p.ratio;
    comp.attack.value    = p.attack   / 1000;
    comp.release.value   = p.release  / 1000;
    comp.knee.value      = p.knee;
    const mg = ctx.createGain();
    mg.gain.value = Math.pow(10, p.makeup / 20);
    src.connect(comp); comp.connect(mg); mg.connect(ctx.destination);
    src.start();
    srcRef.current   = src;
    compRef.current  = comp;
    makeupRef.current = mg;
    setPlaying(true);
  };

  const playEQ = (bands) => {
    stopPlayback();
    const ctx = getCtx();
    const ab  = ctx.createBuffer(1, rawBuf.length, ctx.sampleRate);
    ab.getChannelData(0).set(rawBuf);
    const src = ctx.createBufferSource(); src.buffer = ab; src.loop = true;
    let prev = src;
    const filters = EQ_BANDS.map((b, i) => {
      const f = ctx.createBiquadFilter();
      f.type = 'peaking'; f.frequency.value = b.f; f.Q.value = 1.4; f.gain.value = bands[i];
      prev.connect(f); prev = f; return f;
    });
    const g = ctx.createGain(); g.gain.value = 0.55;
    prev.connect(g); g.connect(ctx.destination);
    src.start();
    srcRef.current   = src;
    filtersRef.current = filters;
    setPlaying(true);
  };

  const playOffline = async (p) => {
    setProcessing(true);
    stopPlayback();
    const ctx = getCtx();
    let processed;
    try {
      if (exerciseType === 'gate') {
        processed = await processGate(rawBuf, ctx.sampleRate, p);
      } else if (exerciseType === 'ducker') {
        const trig = buildKickBuffer(ctx.sampleRate);
        const pad  = new Float32Array(trig.length);
        for (let i = 0; i < pad.length; i++) pad[i] = rawBuf[i % rawBuf.length];
        processed = await processDucker(trig, pad, ctx.sampleRate, p);
      }
    } catch (e) { setProcessing(false); return; }
    setProcessing(false);
    if (!processed) return;
    const ab  = ctx.createBuffer(1, processed.length, ctx.sampleRate);
    ab.getChannelData(0).set(processed);
    const src = ctx.createBufferSource(); src.buffer = ab; src.loop = true;
    src.connect(ctx.destination); src.start();
    srcRef.current = src;
    setPlaying(true);
  };

  const handlePlay = () => {
    if (!rawBuf) return;
    if (exerciseType === 'compressor') playCompressor(params);
    else if (exerciseType === 'eq')    playEQ(params);
    else                               playOffline(params);
  };

  // ── param change handlers ───────────────────────────────────────
  const updateParam = (key, v) => {
    const next = { ...params, [key]: v };
    setParams(next);
    // Live update for compressor while playing
    if (playing && exerciseType === 'compressor' && compRef.current) {
      if (key === 'threshold') compRef.current.threshold.value = v;
      else if (key === 'ratio')   compRef.current.ratio.value  = v;
      else if (key === 'attack')  compRef.current.attack.value = v / 1000;
      else if (key === 'release') compRef.current.release.value = v / 1000;
      else if (key === 'knee')    compRef.current.knee.value    = v;
      else if (key === 'makeup' && makeupRef.current) makeupRef.current.gain.value = Math.pow(10, v / 20);
    }
  };

  const updateEQ = (i, v) => {
    const next = [...params]; next[i] = v; setParams(next);
    if (playing && filtersRef.current[i]) filtersRef.current[i].gain.value = v;
  };

  const needsRerender = exerciseType === 'gate' || exerciseType === 'ducker';

  if (loading) return (
    <div style={{ marginTop: 10, padding: 10, background: C.panel, borderRadius: 6, fontSize: 11, color: C.y }}>
      ⏳ טוען קובץ לתצוגה מקדימה...
    </div>
  );

  return (
    <div style={{ marginTop: 10, padding: 14, background: '#0a0f0a', borderRadius: 8, border: '1px solid ' + C.y + '55' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.y }}>🎛️ כיוון האפקט — {exerciseType}</span>
        <div style={{ marginRight: 'auto', display: 'flex', gap: 6 }}>
          {playing ? (
            <button onClick={stopPlayback}
              style={{ padding: '5px 14px', background: C.red, color: '#000', border: 'none', borderRadius: 5, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              ■ עצור
            </button>
          ) : (
            <button onClick={handlePlay} disabled={processing || !rawBuf}
              style={{ padding: '5px 14px', background: C.green, color: '#000', border: 'none', borderRadius: 5, fontWeight: 700, fontSize: 11, cursor: 'pointer', opacity: processing ? 0.6 : 1 }}>
              {processing ? '⏳' : '▶ נגן'}
            </button>
          )}
          {needsRerender && playing && (
            <button onClick={() => playOffline(params)} disabled={processing}
              style={{ padding: '5px 12px', background: 'transparent', color: C.blue, border: '1px solid ' + C.blue, borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>
              ↺ עדכן
            </button>
          )}
        </div>
      </div>

      {/* EQ controls */}
      {isEQ && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 4, marginBottom: 12 }}>
          {EQ_BANDS.map((b, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 9, color: C.y }}>{params[i] > 0 ? '+' : ''}{params[i].toFixed(1)}</span>
              <div style={{ position: 'relative', width: 18, height: 60 }}>
                <input type="range" min="-12" max="12" step="0.5" value={params[i]}
                  onChange={e => updateEQ(i, parseFloat(e.target.value))}
                  style={{ position: 'absolute', width: 60, height: 18, top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(90deg)', accentColor: C.y, cursor: 'pointer' }} />
              </div>
              <span style={{ fontSize: 8, color: C.muted }}>{b.l}</span>
            </div>
          ))}
        </div>
      )}

      {/* Slider controls for compressor / gate / ducker */}
      {paramsConfig && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {paramsConfig.map(({ key, label, unit, min, max, step }) => (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginBottom: 3 }}>
                <span style={{ color: C.text }}>{label}</span>
                <span style={{ color: C.y }}>{params[key]}{unit}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={params[key]}
                onChange={e => updateParam(key, parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: C.y }} />
            </div>
          ))}
        </div>
      )}

      {needsRerender && (
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>
          💡 שנה פרמטרים ולחץ ↺ עדכן בזמן ניגון לשמוע את השינוי
        </div>
      )}

      {/* Set as Target */}
      <button onClick={() => {
        stopPlayback();
        onSetTarget(isEQ ? { bands: params } : params);
      }}
        style={{ width: '100%', padding: '10px', background: C.y, color: '#000', border: 'none', borderRadius: 6, fontWeight: 900, fontSize: 12, cursor: 'pointer' }}>
        📌 הגדר כטרגט לתלמידים
      </button>
    </div>
  );
}
