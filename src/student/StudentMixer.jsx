import { useState, useRef, useEffect } from 'react';
import { C } from '../constants.js';
import Knob   from '../components/Knob.jsx';
import Fader  from '../components/Fader.jsx';
import VU     from '../components/VU.jsx';

// ── EQ constants ──
const EQ_BANDS = [
  { type: 'lowshelf',  def: 80,    lbl: 'LOW',   fMn: 40,   fMx: 500,   hasQ: false, hasFilter: true  },
  { type: 'peaking',   def: 400,   lbl: 'L-MID', fMn: 80,   fMx: 3000,  hasQ: true,  hasFilter: false },
  { type: 'peaking',   def: 3500,  lbl: 'H-MID', fMn: 500,  fMx: 15000, hasQ: true,  hasFilter: false },
  { type: 'highshelf', def: 10000, lbl: 'HIGH',  fMn: 2000, fMx: 20000, hasQ: false, hasFilter: true  },
];
const LOW_FILTER_TYPES  = ['lowshelf', 'highpass', 'lowpass'];
const HIGH_FILTER_TYPES = ['highshelf', 'highpass', 'lowpass'];
const FILTER_LABELS     = { lowshelf: 'Shelf', highshelf: 'Shelf', highpass: 'HP', lowpass: 'LP' };
const SLOPE_OPTS        = [{ l: '6dB', v: 0.7 }, { l: '12dB', v: 1.4 }, { l: '24dB', v: 2.8 }];

const AUX_FX_OPTS = ['Delay', 'Reverb', 'Chorus', 'Flanger'];
const AUX_COLORS  = ['#4488ff', '#00e87a', '#ff44bb'];
const AUX_FX_PARAMS = {
  Delay:   [{ k: 'time', l: 'Time',     mn: .05, mx: 1.5 }, { k: 'fb',    l: 'Feedback', mn: 0, mx: .9 }, { k: 'mix',   l: 'Mix',   mn: 0, mx: 1 }],
  Reverb:  [{ k: 'decay',l: 'Decay',    mn: .3,  mx: 6   }, { k: 'mix',   l: 'Mix',      mn: 0, mx: 1  }],
  Chorus:  [{ k: 'rate', l: 'Rate Hz',  mn: .1,  mx: 8   }, { k: 'depth', l: 'Depth',    mn: 0, mx: 1  }, { k: 'mix', l: 'Mix', mn: 0, mx: 1 }],
  Flanger: [{ k: 'rate', l: 'Rate Hz',  mn: .1,  mx: 5   }, { k: 'depth', l: 'Depth',    mn: 0, mx: 1  }, { k: 'fb', l: 'Feedback', mn: 0, mx: .9 }, { k: 'mix', l: 'Mix', mn: 0, mx: 1 }],
};

const mkStrip = () => ({ fader: .75, pan: 0, mute: false, sends: [0, 0, 0], eq: EQ_BANDS.map(b => ({ g: 0, f: b.def, q: 1.0, filterType: b.type, slope: 0.7 })) });
const mkAuxM  = (t, rl = .6) => {
  const p = t === 'Delay' ? { time: .4, fb: .4, mix: .6 } : t === 'Reverb' ? { decay: 2.5, mix: .65 } : t === 'Chorus' ? { rate: 1, depth: .5, mix: .5 } : { rate: .5, depth: .5, fb: .4, mix: .5 };
  return { type: t, rl, open: false, params: p };
};

// ── EQ Curve canvas ──
function EQCurve({ bands }) {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const W = canvas.offsetWidth || 600, H = 200;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H);

    [40,100,200,500,1000,2000,5000,10000,20000].forEach(f => {
      const x = Math.log10(f / 20) / Math.log10(1000) * W;
      ctx.strokeStyle = '#151515'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      if ([100,1000,10000].includes(f)) { ctx.fillStyle = '#2a2a2a'; ctx.font = '7px monospace'; ctx.fillText(f >= 1000 ? f / 1000 + 'k' : f, x + 2, H - 3); }
    });
    [-12,-9,-6,-3,0,3,6,9,12].forEach(g => {
      const y = H / 2 - g / 12 * (H / 2 - 8);
      ctx.strokeStyle = g === 0 ? '#2e2e2e' : '#111'; ctx.lineWidth = g === 0 ? 1.5 : 1;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      if (g !== 0 && Math.abs(g) % 6 === 0) { ctx.fillStyle = '#2a2a2a'; ctx.font = '7px monospace'; ctx.fillText(g > 0 ? '+' + g : g, 2, y - 2); }
    });

    const colors = ['#4488ff', '#FFD700', '#ff3355', '#00e87a'];
    bands.forEach((b, bi) => {
      const bd = EQ_BANDS[bi]; const ft = b.filterType || bd.type; const q = b.q || 1.0;
      ctx.strokeStyle = colors[bi] + '66'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      ctx.beginPath();
      for (let px = 0; px < W; px++) {
        const freq = 20 * Math.pow(1000, px / W);
        let db = 0;
        if      (ft === 'peaking')   { const bw = freq / b.f - b.f / freq; db = b.g / (1 + Math.pow(bw * q, 2)); }
        else if (ft === 'lowshelf')  db = b.g / (1 + Math.pow(freq / b.f, 2));
        else if (ft === 'highshelf') db = b.g / (1 + Math.pow(b.f / freq, 2));
        else if (ft === 'highpass')  db = -12 * Math.log2(1 + Math.pow(b.f / Math.max(freq, 1), b.slope || 0.7) * b.slope);
        else if (ft === 'lowpass')   db = -12 * Math.log2(1 + Math.pow(freq / b.f, b.slope || 0.7) * b.slope);
        const y = H / 2 - Math.max(-14, Math.min(14, db)) / 14 * (H / 2 - 8);
        px === 0 ? ctx.moveTo(0, y) : ctx.lineTo(px, y);
      }
      ctx.stroke(); ctx.setLineDash([]);
    });

    ctx.strokeStyle = C.y; ctx.lineWidth = 2.5; ctx.shadowColor = C.y; ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let px = 0; px < W; px++) {
      const freq = 20 * Math.pow(1000, px / W);
      let db = 0;
      bands.forEach((b, bi) => {
        const bd = EQ_BANDS[bi]; const ft = b.filterType || bd.type; const q = b.q || 1.0;
        if      (ft === 'peaking')   { const bw = freq / b.f - b.f / freq; db += b.g / (1 + Math.pow(bw * q, 2)); }
        else if (ft === 'lowshelf')  db += b.g / (1 + Math.pow(freq / b.f, 2));
        else if (ft === 'highshelf') db += b.g / (1 + Math.pow(b.f / freq, 2));
        else if (ft === 'highpass')  db += -12 * Math.log2(1 + Math.pow(b.f / Math.max(freq, 1), b.slope || 0.7) * b.slope);
        else if (ft === 'lowpass')   db += -12 * Math.log2(1 + Math.pow(freq / b.f, b.slope || 0.7) * b.slope);
      });
      const y = H / 2 - Math.max(-14, Math.min(14, db)) / 14 * (H / 2 - 8);
      px === 0 ? ctx.moveTo(0, y) : ctx.lineTo(px, y);
    }
    ctx.stroke(); ctx.shadowBlur = 0;
  }, [bands]);

  return <canvas ref={ref} style={{ width: '100%', height: 200, display: 'block', borderRadius: 6, border: '1px solid ' + C.borderLit }} />;
}

// ── Main component ──
export default function StudentMixer({ channels: chs }) {
  const [strips, setStrips] = useState(() => chs.map(mkStrip));
  const [auxMs,  setAuxMs]  = useState([mkAuxM('Delay'), mkAuxM('Reverb'), mkAuxM('Chorus')]);
  const [playing,  setPlaying]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [eqIdx,    setEqIdx]    = useState(null);
  const [vus,      setVus]      = useState(Array(16).fill(0));

  const actxRef    = useRef(null); const nodesRef   = useRef({});
  const auxBusRef  = useRef([]);   const auxRetRef  = useRef([]);
  const sendRef    = useRef({});   const decodedRef = useRef({});
  const animRef    = useRef();     const stripsRef  = useRef(strips);

  useEffect(() => { stripsRef.current = strips; }, [strips]);

  const getCtx = () => {
    if (!actxRef.current) actxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (actxRef.current.state === 'suspended') actxRef.current.resume();
    return actxRef.current;
  };

  const buildFx = (ctx, type, p) => {
    if (type === 'Delay') {
      const inp = ctx.createGain(), del = ctx.createDelay(2), fb = ctx.createGain(), wet = ctx.createGain(), dry = ctx.createGain(), out = ctx.createGain();
      del.delayTime.value = p.time || .4; fb.gain.value = p.fb || .4; wet.gain.value = p.mix || .6; dry.gain.value = 1 - (p.mix || .6);
      inp.connect(del); del.connect(fb); fb.connect(del); del.connect(wet); inp.connect(dry); wet.connect(out); dry.connect(out); return { inp, out };
    }
    if (type === 'Reverb') {
      const dec = p.decay || 2.5, len = Math.floor(ctx.sampleRate * dec), ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2); }
      const conv = ctx.createConvolver(); conv.buffer = ir;
      const wet = ctx.createGain(), dry = ctx.createGain(), inp = ctx.createGain(), out = ctx.createGain();
      wet.gain.value = p.mix || .65; dry.gain.value = 1 - (p.mix || .65);
      inp.connect(conv); conv.connect(wet); inp.connect(dry); wet.connect(out); dry.connect(out); return { inp, out };
    }
    if (type === 'Chorus') {
      const inp = ctx.createGain(), del = ctx.createDelay(.05), lfo = ctx.createOscillator(), lfoG = ctx.createGain(), wet = ctx.createGain(), dry = ctx.createGain(), out = ctx.createGain();
      del.delayTime.value = .022; lfo.frequency.value = p.rate || 1; lfoG.gain.value = (p.depth || .5) * .01;
      wet.gain.value = p.mix || .5; dry.gain.value = 1 - (p.mix || .5);
      lfo.connect(lfoG); lfoG.connect(del.delayTime); inp.connect(del); del.connect(wet); inp.connect(dry); wet.connect(out); dry.connect(out); lfo.start(); return { inp, out };
    }
    // Flanger
    const inp = ctx.createGain(), del = ctx.createDelay(.02), lfo = ctx.createOscillator(), lfoG = ctx.createGain(), fb = ctx.createGain(), wet = ctx.createGain(), dry = ctx.createGain(), out = ctx.createGain();
    del.delayTime.value = .005; lfo.frequency.value = p.rate || .5; lfoG.gain.value = (p.depth || .5) * .003; fb.gain.value = p.fb || .4;
    wet.gain.value = p.mix || .5; dry.gain.value = 1 - (p.mix || .5);
    lfo.connect(lfoG); lfoG.connect(del.delayTime); inp.connect(del); del.connect(fb); fb.connect(del); del.connect(wet); inp.connect(dry); wet.connect(out); dry.connect(out); lfo.start(); return { inp, out };
  };

  const stopAll = () => {
    cancelAnimationFrame(animRef.current);
    Object.values(nodesRef.current).forEach(n => { try { n.src.stop(); } catch (e) {} });
    nodesRef.current = {}; sendRef.current = {};
    setPlaying(false); setVus(Array(16).fill(0));
  };

  const playAll = async () => {
    if (playing) { stopAll(); return; }
    const loaded = chs.filter(c => c.audioUrl).length; if (!loaded) return;
    setLoading(true);
    try {
      const ctx = getCtx();
      const master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
      auxBusRef.current = []; auxRetRef.current = [];
      auxMs.forEach((a, j) => {
        const bus = ctx.createGain(); bus.gain.value = 1;
        const fx = buildFx(ctx, a.type, a.params);
        const ret = ctx.createGain(); ret.gain.value = a.rl;
        bus.connect(fx.inp); fx.out.connect(ret); ret.connect(master);
        auxBusRef.current[j] = bus; auxRetRef.current[j] = ret;
      });
      await Promise.all(chs.map(async (ch, i) => {
        const s = stripsRef.current[i];
        if (!ch.audioUrl || s.mute) return;
        if (!decodedRef.current[ch.audioUrl]) {
          const r = await fetch(ch.audioUrl);
          decodedRef.current[ch.audioUrl] = await ctx.decodeAudioData(await r.arrayBuffer());
        }
        const src = ctx.createBufferSource(); src.buffer = decodedRef.current[ch.audioUrl]; src.loop = true;
        let prev = src;
        const eqNodes = EQ_BANDS.map((b, bi) => {
          const f = ctx.createBiquadFilter(); f.type = s.eq[bi].filterType || b.type;
          f.frequency.value = s.eq[bi].f; f.gain.value = s.eq[bi].g; f.Q.value = s.eq[bi].q || 1.0;
          prev.connect(f); prev = f; return f;
        });
        const gainN = ctx.createGain(); gainN.gain.value = s.fader; prev.connect(gainN);
        const panN  = ctx.createStereoPanner(); panN.pan.value = s.pan; gainN.connect(panN); panN.connect(master);
        if (!sendRef.current[i]) sendRef.current[i] = [];
        s.sends.forEach((sv, j) => { const sn = ctx.createGain(); sn.gain.value = sv; gainN.connect(sn); sn.connect(auxBusRef.current[j]); sendRef.current[i][j] = sn; });
        src.start(); nodesRef.current[i] = { src, gainN, panN, eqNodes };
      }));
      setPlaying(true);
      const draw = () => {
        const s = stripsRef.current;
        setVus(Array.from({ length: 16 }, (_, i) => (!nodesRef.current[i] || s[i] && s[i].mute) ? 0 : s[i] ? s[i].fader * (0.2 + Math.random() * .9) : 0));
        animRef.current = requestAnimationFrame(draw);
      };
      animRef.current = requestAnimationFrame(draw);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const setFaderV  = (i, v) => { setStrips(s => s.map((x, k) => k === i ? { ...x, fader: v } : x)); if (nodesRef.current[i]) nodesRef.current[i].gainN.gain.value = v; };
  const setPanV    = (i, v) => { setStrips(s => s.map((x, k) => k === i ? { ...x, pan: v }   : x)); if (nodesRef.current[i]) nodesRef.current[i].panN.pan.value = v; };
  const toggleMute = i      => setStrips(s => s.map((x, k) => { if (k !== i) return x; const m = !x.mute; if (nodesRef.current[i]) nodesRef.current[i].gainN.gain.value = m ? 0 : x.fader; return { ...x, mute: m }; }));
  const setSend    = (i, j, v) => { setStrips(s => s.map((x, k) => k === i ? { ...x, sends: x.sends.map((sv, sj) => sj === j ? v : sv) } : x)); if (sendRef.current[i]?.[j]) sendRef.current[i][j].gain.value = v; };
  const setEqBand  = (i, bi, field, v) => {
    setStrips(s => s.map((x, k) => k === i ? { ...x, eq: x.eq.map((b, bj) => bj === bi ? { ...b, [field]: v } : b) } : x));
    const en = nodesRef.current[i]?.eqNodes?.[bi];
    if (en) {
      if (field === 'g')          en.gain.value      = v;
      if (field === 'f')          en.frequency.value = v;
      if (field === 'q')          en.Q.value         = v;
      if (field === 'filterType') en.type            = v;
      if (field === 'slope')      en.Q.value         = v;
    }
  };
  const setAuxReturn = (j, v) => { setAuxMs(a => a.map((x, k) => k === j ? { ...x, rl: v } : x)); if (auxRetRef.current[j]) auxRetRef.current[j].gain.value = v; };
  const cycleAuxType = j      => { if (playing) stopAll(); setAuxMs(a => a.map((x, k) => { if (k !== j) return x; const nt = AUX_FX_OPTS[(AUX_FX_OPTS.indexOf(x.type) + 1) % AUX_FX_OPTS.length]; return mkAuxM(nt, x.rl); })); };

  useEffect(() => () => { stopAll(); try { actxRef.current && actxRef.current.close(); } catch (e) {} }, []);

  const loaded = chs.filter(c => c.audioUrl).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 900, color: C.y, margin: '0 0 2px' }}>🎚️ מיקסר — 16 ערוצים</h1>
          <p style={{ color: C.muted, margin: 0, fontSize: 12 }}>{loaded + ' ערוצים עם אודיו · ' + (playing ? '● מנגן' : 'מושהה')}</p>
        </div>
        <button onClick={playAll} disabled={loading || loaded === 0}
          style={{ padding: '12px 40px', background: playing ? C.red : loaded === 0 ? C.yDim : C.green, color: '#000', border: 'none', borderRadius: 9, fontWeight: 900, fontSize: 16, cursor: loaded === 0 ? 'not-allowed' : 'pointer', letterSpacing: 2, transition: 'background .15s' }}>
          {loading ? '⏳ טוען...' : playing ? '■  STOP ALL' : '▶  PLAY ALL'}
        </button>
      </div>

      {/* AUX Masters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {auxMs.map((a, j) => (
          <div key={j} style={{ flex: '1 1 210px', background: C.card, borderRadius: 9, border: '1px solid ' + (a.open ? AUX_COLORS[j] + '55' : C.borderLit), overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: AUX_COLORS[j], flexShrink: 0, width: 46 }}>{'AUX ' + (j + 1)}</span>
              <div style={{ background: '#0a0a0a', border: '1px solid ' + AUX_COLORS[j] + '44', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontFamily: 'monospace', color: AUX_COLORS[j], flex: 1, textAlign: 'center' }}>{a.type}</div>
              <Knob val={a.rl} min={0} max={1} onChange={v => setAuxReturn(j, v)} label="RTN" size={28} color={AUX_COLORS[j]} />
              <button onClick={() => cycleAuxType(j)} title="שנה אפקט" style={{ width: 28, height: 28, background: 'transparent', color: C.blue, border: '1px solid ' + C.blue, borderRadius: 5, cursor: 'pointer', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>⇄</button>
              <button onClick={() => setAuxMs(ax => ax.map((x, k) => k === j ? { ...x, open: !x.open } : x))}
                style={{ padding: '3px 10px', background: a.open ? AUX_COLORS[j] + '22' : 'transparent', color: a.open ? AUX_COLORS[j] : C.muted, border: '1px solid ' + (a.open ? AUX_COLORS[j] : C.borderLit), borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {a.open ? '▲' : '▼ עריכה'}
              </button>
            </div>
            {a.open && (
              <div style={{ padding: '12px 16px', background: '#0a0a0a', borderTop: '1px solid ' + C.dim }}>
                <div style={{ fontSize: 10, color: AUX_COLORS[j], fontWeight: 700, marginBottom: 10, letterSpacing: .5 }}>{a.type + ' · AUX ' + (j + 1) + ' Parameters'}</div>
                <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
                  {(AUX_FX_PARAMS[a.type] || []).map(pr => (
                    <Knob key={pr.k} val={a.params[pr.k] != null ? a.params[pr.k] : pr.mn} min={pr.mn} max={pr.mx}
                      onChange={v => setAuxMs(ax => ax.map((x, i) => i === j ? { ...x, params: { ...x.params, [pr.k]: v } } : x))}
                      label={pr.l} size={52} color={AUX_COLORS[j]} />
                  ))}
                </div>
                {playing && <div style={{ marginTop: 8, fontSize: 10, color: C.muted }}>⚠ שינויים יכנסו לתוקף בהפעלה הבאה</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Console */}
      <div style={{ background: '#040404', border: '2px solid #181818', borderRadius: 14, padding: '12px 8px 8px', overflowX: 'auto', boxShadow: 'inset 0 4px 24px rgba(0,0,0,.9)' }}>
        <div style={{ display: 'flex', gap: 2, minWidth: 16 * 72 + 15 * 2 }}>
          {chs.map((ch, i) => {
            const s = strips[i]; const isM = i === 15;
            return (
              <div key={i} style={{ width: 72, background: isM ? 'linear-gradient(180deg,#1e1800,#100d00)' : 'linear-gradient(180deg,#181818,#0d0d0d)', border: '1px solid ' + (isM ? C.yDim : '#1c1c1c'), borderRadius: 7, padding: '6px 4px 5px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: isM ? C.y : '#777', width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>{ch.name}</div>
                <button onClick={() => setEqIdx(eqIdx === i ? null : i)}
                  style={{ width: 46, height: 13, background: eqIdx === i ? C.y + '2a' : '#0e0e0e', color: eqIdx === i ? C.y : '#3a3a3a', border: '1px solid ' + (eqIdx === i ? C.y + '44' : '#1c1c1c'), borderRadius: 3, cursor: 'pointer', fontSize: 7, fontWeight: 700, letterSpacing: 1 }}>
                  4B·EQ
                </button>
                {/* AUX sends */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', alignItems: 'center', padding: '2px 0' }}>
                  {[0, 1, 2].map(j => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%', justifyContent: 'center' }}>
                      <div style={{ fontSize: 6, color: AUX_COLORS[j], fontWeight: 700, width: 12, textAlign: 'right', flexShrink: 0 }}>{'A' + (j + 1)}</div>
                      <Knob val={s.sends[j]} min={0} max={1} onChange={v => setSend(i, j, v)} label="" size={22} color={AUX_COLORS[j]} />
                    </div>
                  ))}
                </div>
                <Knob val={s.pan} min={-1} max={1} onChange={v => setPanV(i, v)} label="PAN" size={26} color={C.green} />
                <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                  <VU level={playing && s && !s.mute ? vus[i] : 0} />
                  <Fader val={s.fader} onChange={v => setFaderV(i, v)} ht={76} />
                </div>
                <button onClick={() => toggleMute(i)}
                  style={{ width: 46, padding: '2px 0', background: s.mute ? C.red : '#0e0e0e', color: s.mute ? '#fff' : C.muted, border: '1px solid ' + (s.mute ? C.red : '#1c1c1c'), borderRadius: 3, fontSize: 7, fontWeight: 700, cursor: 'pointer', letterSpacing: .5 }}>
                  MUTE
                </button>
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, color: '#141414', fontSize: 8, letterSpacing: 3, fontFamily: 'monospace', fontWeight: 700 }}>SOUND ACADEMY · TLA SERIES · 16CH ANALOG CONSOLE</div>
      </div>

      {/* EQ Panel */}
      {eqIdx !== null && strips[eqIdx] && (
        <div style={{ marginTop: 10, background: C.card, borderRadius: 10, border: '1px solid ' + C.y + '44', padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 900, color: C.y, fontSize: 14 }}>{'📈 4-Band Semi-Parametric EQ — ' + (chs[eqIdx]?.name || ('Ch ' + (eqIdx + 1)))}</div>
            <button onClick={() => setEqIdx(null)} style={{ background: 'transparent', border: '1px solid ' + C.borderLit, color: C.muted, cursor: 'pointer', fontSize: 14, borderRadius: 6, padding: '3px 9px' }}>✕</button>
          </div>
          <EQCurve bands={strips[eqIdx].eq} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 12 }}>
            {[...EQ_BANDS].reverse().map((band, ri) => {
              const bi      = EQ_BANDS.length - 1 - ri;
              const eq      = strips[eqIdx].eq[bi];
              const bColor  = [C.blue, C.y, C.red, C.green][bi];
              const filterOpts = bi === 0 ? LOW_FILTER_TYPES : bi === 3 ? HIGH_FILTER_TYPES : null;
              const curFt   = eq.filterType || band.type;
              const isFilter = curFt === 'highpass' || curFt === 'lowpass';

              return (
                <div key={bi} style={{ background: C.panel, borderRadius: 8, padding: '12px 8px', border: '1px solid ' + bColor + '33', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: bColor, letterSpacing: 1 }}>{band.lbl}</span>

                  {filterOpts && (
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {filterOpts.map(ft => (
                        <button key={ft} onClick={() => setEqBand(eqIdx, bi, 'filterType', ft)}
                          style={{ padding: '2px 7px', fontSize: 9, fontWeight: 700, cursor: 'pointer', borderRadius: 4, background: curFt === ft ? bColor : C.dim, color: curFt === ft ? '#000' : C.muted, border: '1px solid ' + (curFt === ft ? bColor : C.borderLit) }}>
                          {FILTER_LABELS[ft] || ft}
                        </button>
                      ))}
                    </div>
                  )}

                  {filterOpts && isFilter && (
                    <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                      {SLOPE_OPTS.map(sl => (
                        <button key={sl.l} onClick={() => setEqBand(eqIdx, bi, 'slope', sl.v)}
                          style={{ padding: '2px 6px', fontSize: 9, fontWeight: 700, cursor: 'pointer', borderRadius: 4, background: Math.abs((eq.slope || 0.7) - sl.v) < 0.1 ? bColor : C.dim, color: Math.abs((eq.slope || 0.7) - sl.v) < 0.1 ? '#000' : C.muted, border: '1px solid ' + (Math.abs((eq.slope || 0.7) - sl.v) < 0.1 ? bColor : C.borderLit) }}>
                          {sl.l}
                        </button>
                      ))}
                    </div>
                  )}

                  {!isFilter && (
                    <Knob val={eq.g} min={-12} max={12} onChange={v => setEqBand(eqIdx, bi, 'g', v)} label={(eq.g >= 0 ? '+' : '') + eq.g.toFixed(1) + 'dB'} size={52} color={bColor} />
                  )}

                  {band.hasQ && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <span style={{ fontSize: 8, color: C.muted, letterSpacing: .5 }}>Q</span>
                      <Knob val={eq.q || 1} min={0.1} max={10} onChange={v => setEqBand(eqIdx, bi, 'q', v)} label={'Q ' + (eq.q || 1).toFixed(1)} size={42} color={bColor} />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontSize: 8, color: C.muted }}>Frequency</span>
                    <div style={{ background: '#0a0a0a', border: '1px solid ' + bColor + '55', borderRadius: 5, padding: '3px 9px', fontSize: 13, color: bColor, fontFamily: 'monospace', fontWeight: 700, cursor: 'ns-resize', userSelect: 'none', minWidth: 56, textAlign: 'center' }}
                      onMouseDown={e => {
                        e.preventDefault();
                        const sy = e.clientY, sf = eq.f, lr = Math.log(band.fMx / band.fMn);
                        const mv = m => { const nf = sf * Math.exp(-lr * (m.clientY - sy) / 150); setEqBand(eqIdx, bi, 'f', Math.max(band.fMn, Math.min(band.fMx, Math.round(nf)))); };
                        const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
                        window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
                      }}>
                      {eq.f >= 1000 ? (eq.f / 1000).toFixed(eq.f >= 10000 ? 0 : 1) + 'k' : eq.f}<span style={{ fontSize: 9 }}>Hz</span>
                    </div>
                    <span style={{ fontSize: 8, color: C.muted }}>↕ גרור</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
