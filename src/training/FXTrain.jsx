import { useState, useRef, useEffect } from 'react';
import { C } from '../constants.js';
import Knob from '../components/Knob.jsx';
import MetaFlangerUI from './MetaFlangerUI.jsx';
import { useSignalSource } from '../hooks/useSignalSource.js';

const FX_DEFS = [
  { id: 'delay',   l: 'Delay',   icon: '⏱️', params: [{ k: 'time', l: 'Time (s)', mn: .05, mx: 1 }, { k: 'fb', l: 'Feedback', mn: 0, mx: .9 }, { k: 'mix', l: 'Mix', mn: 0, mx: 1 }] },
  { id: 'reverb',  l: 'Reverb',  icon: '🏛️', params: [{ k: 'decay', l: 'Decay', mn: .5, mx: 6 }, { k: 'size', l: 'Size', mn: 0, mx: 1 }, { k: 'mix', l: 'Mix', mn: 0, mx: 1 }] },
  { id: 'chorus',  l: 'Chorus',  icon: '🌊', params: [{ k: 'rate', l: 'Rate Hz', mn: .1, mx: 5 }, { k: 'depth', l: 'Depth', mn: 0, mx: 1 }, { k: 'mix', l: 'Mix', mn: 0, mx: 1 }] },
  { id: 'flanger', l: 'Flanger', icon: '🔁', params: [{ k: 'mix', l: 'Mix', mn: 0, mx: 100 }, { k: 'fb', l: 'Feedback', mn: 0, mx: 100 }, { k: 'time', l: 'Delay ms', mn: 0.1, mx: 20 }, { k: 'rate', l: 'Rate Hz', mn: 0.1, mx: 15 }, { k: 'depth', l: 'Depth', mn: 0, mx: 12 }] },
];

export default function FXTrain({ exercise, onComplete }) {
  const [fx,    setFx]    = useState(FX_DEFS[0]);
  const [tgt,   setTgt]   = useState(null);
  const [usr,   setUsr]   = useState({});
  const [phase, setPhase] = useState('idle');
  const [res,   setRes]   = useState(null);
  const actx  = useRef(null);
  const osRef = useRef(null);

  const { sigBufRef, loading } = useSignalSource(exercise);

  const getCtx = () => {
    if (!actx.current) actx.current = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.current.state === 'suspended') actx.current.resume();
    return actx.current;
  };

  const stop = () => { try { osRef.current && osRef.current.stop(); } catch (e) {} osRef.current = null; };

  const makeSignal = (ctx, defaultType, defaultFreq, defaultDur) => {
    if (sigBufRef.current) {
      const ab = ctx.createBuffer(1, sigBufRef.current.length, ctx.sampleRate);
      ab.getChannelData(0).set(sigBufRef.current);
      const src = ctx.createBufferSource(); src.buffer = ab; src.loop = true;
      const g = ctx.createGain(); g.gain.value = 0.5;
      src.connect(g);
      return { node: g, start: () => src.start(), cleanup: () => { osRef.current = src; } };
    }
    const os = ctx.createOscillator(); os.type = defaultType; os.frequency.value = defaultFreq;
    const env = ctx.createGain();
    env.gain.setValueAtTime(.4, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + defaultDur * 0.8);
    os.connect(env);
    return { node: env, start: () => { os.start(); os.stop(ctx.currentTime + defaultDur); }, cleanup: () => { osRef.current = os; } };
  };

  const playDelay = p => {
    stop(); const ctx = getCtx();
    const { node: sig, start, cleanup } = makeSignal(ctx, 'sawtooth', 220, 3);
    const del = ctx.createDelay(2); del.delayTime.value = p.time || .25;
    const fbg = ctx.createGain(); fbg.gain.value = p.fb || .4;
    const dry = ctx.createGain(); dry.gain.value = 1 - (p.mix || .5);
    const wet = ctx.createGain(); wet.gain.value = p.mix || .5;
    const out = ctx.createGain(); out.gain.value = .65;
    sig.connect(dry); sig.connect(del); del.connect(fbg); fbg.connect(del); del.connect(wet);
    dry.connect(out); wet.connect(out); out.connect(ctx.destination);
    start(); cleanup();
  };

  const playReverb = p => {
    stop(); const ctx = getCtx();
    const decay = p.decay || 2;
    const irLen = Math.floor(ctx.sampleRate * Math.max(.5, decay));
    const ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < irLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, decay * .35); }
    const conv = ctx.createConvolver(); conv.buffer = ir;
    const { node: sig, start, cleanup } = makeSignal(ctx, 'sine', 440, 4);
    const dry = ctx.createGain(); dry.gain.value = 1 - (p.mix || .5);
    const wet = ctx.createGain(); wet.gain.value = p.mix || .5;
    const out = ctx.createGain(); out.gain.value = .65;
    sig.connect(dry); sig.connect(conv); conv.connect(wet); dry.connect(out); wet.connect(out); out.connect(ctx.destination);
    start(); cleanup();
  };

  const playChorus = p => {
    stop(); const ctx = getCtx();
    const { node: sig, start, cleanup } = makeSignal(ctx, 'sawtooth', 330, 3);
    const lfo = ctx.createOscillator(); lfo.frequency.value = p.rate || .8;
    const lfog = ctx.createGain(); lfog.gain.value = (p.depth || .5) * 22;
    const del = ctx.createDelay(.1); del.delayTime.value = .022;
    const dry = ctx.createGain(); dry.gain.value = 1 - (p.mix || .5);
    const wet = ctx.createGain(); wet.gain.value = p.mix || .5;
    const out = ctx.createGain(); out.gain.value = .5;
    lfo.connect(lfog); lfog.connect(del.delayTime);
    sig.connect(dry); sig.connect(del); del.connect(wet);
    dry.connect(out); wet.connect(out); out.connect(ctx.destination);
    lfo.start(); start(); cleanup();
    lfo.stop(ctx.currentTime + 3);
  };

  const playFlanger = p => {
    stop(); const ctx = getCtx();
    const { node: sig, start, cleanup } = makeSignal(ctx, 'sawtooth', 110, 4);
    const lfo = ctx.createOscillator(); lfo.frequency.value = p.rate || 2;
    const lfog = ctx.createGain(); lfog.gain.value = (p.depth || 4) * 0.00025;
    const del = ctx.createDelay(.05); del.delayTime.value = (p.time || 6) * 0.001;
    const fbg = ctx.createGain(); fbg.gain.value = (p.fb || 50) / 100;
    const mix = (p.mix || 50) / 100;
    const dry = ctx.createGain(); dry.gain.value = 1 - mix;
    const wet = ctx.createGain(); wet.gain.value = mix;
    const out = ctx.createGain(); out.gain.value = .5;
    lfo.connect(lfog); lfog.connect(del.delayTime);
    sig.connect(dry); sig.connect(del); del.connect(fbg); fbg.connect(del); del.connect(wet);
    dry.connect(out); wet.connect(out); out.connect(ctx.destination);
    lfo.start(); start(); cleanup();
    lfo.stop(ctx.currentTime + 4);
  };

  const playFx = p => {
    if      (fx.id === 'delay')   playDelay(p);
    else if (fx.id === 'reverb')  playReverb(p);
    else if (fx.id === 'chorus')  playChorus(p);
    else                          playFlanger(p);
  };

  const newRound = () => {
    const t = {}, u = {};
    fx.params.forEach(pr => { t[pr.k] = pr.mn + Math.random() * (pr.mx - pr.mn); u[pr.k] = (pr.mn + pr.mx) / 2; });
    setTgt(t); setUsr(u); setPhase('playing'); setRes(null);
    setTimeout(() => playFx(t), 100);
  };

  const submit = () => {
    if (!tgt) return; stop();
    let d = 0;
    fx.params.forEach(pr => { d += Math.abs((usr[pr.k] || 0) - tgt[pr.k]) / (pr.mx - pr.mn); });
    const sc = Math.max(0, Math.round((1 - d / fx.params.length) * 100));
    setRes(sc); setPhase('done');
    if (onComplete) onComplete(sc);
  };

  useEffect(() => () => stop(), []);

  const tabs = (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
      {FX_DEFS.map(f => (
        <button key={f.id} onClick={() => { setFx(f); setPhase('idle'); setRes(null); setTgt(null); stop(); }}
          style={{ padding: '8px 16px', background: fx.id === f.id ? C.y : C.card, color: fx.id === f.id ? '#000' : C.muted, border: '1px solid ' + (fx.id === f.id ? C.y : C.borderLit), borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
          {f.icon + ' ' + f.l}
        </button>
      ))}
    </div>
  );

  if (loading) return <div style={{ color: C.muted, fontSize: 13, padding: 24 }}>⏳ טוען אות...</div>;

  if (fx.id === 'flanger') return (
    <div>
      <h1 style={{ fontSize: 23, fontWeight: 900, color: C.y, margin: '0 0 5px' }}>🌀 אימון אפקטים</h1>
      {tabs}
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <MetaFlangerUI usr={usr} setUsr={setUsr} tgt={tgt} phase={phase} res={res}
          onNewRound={newRound} onSubmit={submit} onStop={stop}
          onPlayTarget={() => playFlanger(tgt)} onPlayUser={() => playFlanger(usr)} />
      </div>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: 23, fontWeight: 900, color: C.y, margin: '0 0 5px' }}>🌀 אימון אפקטים</h1>
      {tabs}
      <div style={{ background: C.card, padding: 28, borderRadius: 12, border: '1px solid ' + C.borderLit }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 52, marginBottom: 28 }}>
          {fx.params.map(pr => (
            <div key={pr.k} style={{ textAlign: 'center' }}>
              <Knob val={usr[pr.k] != null ? usr[pr.k] : (pr.mn + pr.mx) / 2} min={pr.mn} max={pr.mx}
                onChange={v => setUsr(u => ({ ...u, [pr.k]: v }))} label={pr.l} size={72} />
              {tgt && <div style={{ fontSize: 9, color: C.muted, marginTop: 6 }}>טרגט: {(tgt[pr.k] || 0).toFixed(2)}</div>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 9, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={newRound} style={{ padding: '10px 24px', background: C.y, color: '#000', border: 'none', borderRadius: 7, fontWeight: 900, cursor: 'pointer', fontSize: 13 }}>🎲 תרגיל חדש</button>
          {tgt && <>
            <button onClick={() => playFx(tgt)} style={{ padding: '10px 18px', background: 'transparent', color: C.y,    border: '2px solid ' + C.y,    borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>🔊 טרגט</button>
            <button onClick={() => playFx(usr)} style={{ padding: '10px 18px', background: 'transparent', color: C.blue, border: '2px solid ' + C.blue, borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>🔊 שלי</button>
            <button onClick={submit} disabled={phase === 'done'} style={{ padding: '10px 18px', background: phase === 'done' ? C.yDim : C.green, color: '#000', border: 'none', borderRadius: 7, fontWeight: 900, cursor: 'pointer', fontSize: 13 }}>✓ בדוק</button>
          </>}
          <button onClick={stop} style={{ padding: '10px 14px', background: 'transparent', color: C.red, border: '2px solid ' + C.red, borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>■</button>
        </div>
        {res != null && (
          <div style={{ marginTop: 20, padding: 18, background: res > 70 ? 'rgba(0,232,122,.08)' : 'rgba(255,215,0,.08)', border: '1px solid ' + (res > 70 ? C.green : C.y), borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: res > 70 ? C.green : C.y }}>{res + '/100'}</div>
            <div style={{ color: C.muted, marginTop: 3, fontSize: 13 }}>{res > 70 ? '🎯 מדויק!' : '💪 תמשיך!'}</div>
          </div>
        )}
      </div>
    </div>
  );
}
