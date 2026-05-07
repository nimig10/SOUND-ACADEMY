import { useState, useRef, useEffect } from 'react';
import { C, INSTRUMENTS } from '../constants.js';
import Knob  from '../components/Knob.jsx';
import Fader from '../components/Fader.jsx';
import VU    from '../components/VU.jsx';

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
const AUX_FX_OPTS  = ['Delay', 'Reverb', 'Chorus', 'Flanger'];
const AUX_COLORS   = ['#4488ff', '#00e87a', '#ff44bb'];
const AUX_FX_PARAMS = {
  Delay:   [{ k: 'time', l: 'Time',    mn: .05, mx: 1.5 }, { k: 'fb',    l: 'Feedback', mn: 0, mx: .9 }, { k: 'mix', l: 'Mix', mn: 0, mx: 1 }],
  Reverb:  [{ k: 'decay',l: 'Decay',   mn: .3,  mx: 6   }, { k: 'mix',   l: 'Mix',      mn: 0, mx: 1  }],
  Chorus:  [{ k: 'rate', l: 'Rate Hz', mn: .1,  mx: 8   }, { k: 'depth', l: 'Depth',    mn: 0, mx: 1  }, { k: 'mix', l: 'Mix', mn: 0, mx: 1 }],
  Flanger: [{ k: 'rate', l: 'Rate Hz', mn: .1,  mx: 5   }, { k: 'depth', l: 'Depth',    mn: 0, mx: 1  }, { k: 'fb', l: 'Feedback', mn: 0, mx: .9 }, { k: 'mix', l: 'Mix', mn: 0, mx: 1 }],
};
const mkStrip = () => ({ fader: .75, pan: 0, mute: false, gain: 0, sends: [0, 0, 0], eq: EQ_BANDS.map(b => ({ g: 0, f: b.def, q: 1.0, filterType: b.type, slope: 0.7 })) });
const mkAuxM  = (t, rl = .6) => {
  const p = t === 'Delay' ? { time: .4, fb: .4, mix: .6 } : t === 'Reverb' ? { decay: 2.5, mix: .65 } : t === 'Chorus' ? { rate: 1, depth: .5, mix: .5 } : { rate: .5, depth: .5, fb: .4, mix: .5 };
  return { type: t, rl, open: false, params: p };
};
const fmtTime = s => { const m = Math.floor(s / 60); return String(m).padStart(2,'0') + ':' + String(s % 60).padStart(2,'0'); };

// ── Studer-style Reel SVG ──
function Reel({ size = 110, spinning = false }) {
  const r = size / 2;
  return (
    <div style={{ width: size, height: size, animation: spinning ? 'reelSpin 2.6s linear infinite' : 'none', willChange: 'transform' }}>
      <svg width={size} height={size}>
        {/* Outer flange — brushed aluminum */}
        <circle cx={r} cy={r} r={r - 1} fill="#2c2c2c" stroke="#707070" strokeWidth="2.5" />
        <circle cx={r} cy={r} r={r - 3} fill="#262626" stroke="#3a3a3a" strokeWidth="0.5" />
        {/* Tape wound on reel — multiple brown rings */}
        {[0,1,2,3,4,5,6,7].map(i => (
          <circle key={i} cx={r} cy={r} r={r * 0.78 - i * (r * 0.055)}
            fill="none" stroke={i < 2 ? '#7a4020' : '#4a2410'} strokeWidth="4" opacity={0.92 - i * 0.06} />
        ))}
        {/* 3 Studer-style thick spokes */}
        {[0, 1, 2].map(i => {
          const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
          const cos = Math.cos(a), sin = Math.sin(a);
          const r1 = r * 0.2, r2 = r * 0.74;
          return (
            <g key={i}>
              <line x1={r+r1*cos+1} y1={r+r1*sin+1} x2={r+r2*cos+1} y2={r+r2*sin+1} stroke="#111" strokeWidth="9" strokeLinecap="round" />
              <line x1={r+r1*cos} y1={r+r1*sin} x2={r+r2*cos} y2={r+r2*sin} stroke="#585858" strokeWidth="8" strokeLinecap="round" />
              <line x1={r+r1*cos} y1={r+r1*sin} x2={r+r2*cos} y2={r+r2*sin} stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          );
        })}
        {/* Hub */}
        <circle cx={r} cy={r} r={r * 0.24} fill="#1e1e1e" stroke="#888" strokeWidth="2.5" />
        <circle cx={r} cy={r} r={r * 0.24} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        {/* Center pin */}
        <circle cx={r} cy={r} r={r * 0.09} fill="#080808" stroke="#666" strokeWidth="2" />
        <circle cx={r} cy={r} r={r * 0.04} fill="#444" />
        {/* Rim highlight */}
        <circle cx={r} cy={r} r={r - 2} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
        <circle cx={r} cy={r} r={r - 4} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
      </svg>
    </div>
  );
}

// ── Studer VU Bar ──
function StVU({ level = 0, label = 'L' }) {
  const BARS = 22;
  const lit  = Math.round(Math.min(1, level) * BARS);
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <div style={{ fontSize:8, color:'#666', fontFamily:'monospace', letterSpacing:1 }}>{label}</div>
      <div style={{ display:'flex', gap:1.5, alignItems:'flex-end' }}>
        {Array.from({length: BARS}, (_,i) => {
          const active = i < lit;
          const pct    = i / BARS;
          const col    = pct > 0.86 ? '#ff2222' : pct > 0.72 ? '#ffcc00' : '#22dd55';
          return <div key={i} style={{ width:5, height:3+i*0.9, borderRadius:1, background:active?col:'#1c1c1c', boxShadow:active?`0 0 3px ${col}88`:undefined, transition:'background .05s' }} />;
        })}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', width:'100%', fontSize:6, color:'#3a3a3a', fontFamily:'monospace', paddingTop:1 }}>
        <span>-20</span><span>-10</span><span>-5</span><span>0</span><span>+3</span>
      </div>
    </div>
  );
}

// ── Studer Transport Button ──
function StBtn({ icon, label, color = '#888', active = false, disabled = false, onClick, wide = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: wide ? 88 : 68,
      padding: '10px 6px 8px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      background: active
        ? `linear-gradient(180deg,${color}28 0%,${color}10 100%)`
        : 'linear-gradient(180deg,#2e2e2e 0%,#1c1c1c 100%)',
      border: `1px solid ${active ? color : '#3a3a3a'}`,
      borderTop: `1px solid ${active ? color : '#484848'}`,
      borderRadius: 5,
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: active
        ? `0 0 14px ${color}50, inset 0 0 8px ${color}18, inset 0 1px 0 rgba(255,255,255,0.05)`
        : 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.4)',
      transition: 'all .12s',
      opacity: disabled ? 0.35 : 1,
    }}>
      <span style={{ fontSize: 18, lineHeight: 1, color: disabled ? '#333' : (active ? color : '#777') }}>{icon}</span>
      <span style={{ fontSize: 7, color: disabled ? '#333' : '#555', fontFamily: 'monospace', letterSpacing: 2, fontWeight: 700 }}>{label}</span>
    </button>
  );
}

// ── EQ Curve canvas ──
function EQCurve({ bands, analyser }) {
  const ref    = useRef();
  const rafRef = useRef();

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const drawFrame = () => {
      const W = canvas.offsetWidth || 600, H = 200;
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H);
      [40,100,200,500,1000,2000,5000,10000,20000].forEach(f => {
        const x = Math.log10(f / 20) / Math.log10(1000) * W;
        ctx.strokeStyle = '#151515'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        if ([100,1000,10000].includes(f)) { ctx.fillStyle = '#2a2a2a'; ctx.font = '7px monospace'; ctx.fillText(f >= 1000 ? f/1000+'k' : f, x+2, H-3); }
      });
      [-12,-9,-6,-3,0,3,6,9,12].forEach(g => {
        const y = H/2 - g/12*(H/2-8);
        ctx.strokeStyle = g===0?'#2e2e2e':'#111'; ctx.lineWidth = g===0?1.5:1;
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
        if (g!==0&&Math.abs(g)%6===0){ctx.fillStyle='#2a2a2a';ctx.font='7px monospace';ctx.fillText(g>0?'+'+g:g,2,y-2);}
      });
      if (analyser) {
        const bufLen = analyser.frequencyBinCount, data = new Uint8Array(bufLen), sr = analyser.context.sampleRate;
        analyser.getByteFrequencyData(data);
        ctx.fillStyle='rgba(80,180,255,0.10)'; ctx.strokeStyle='rgba(100,200,255,0.45)'; ctx.lineWidth=1;
        ctx.beginPath(); let first=true;
        for (let k=1;k<bufLen;k++){
          const freq=(k/bufLen)*(sr/2); if(freq<20||freq>20000)continue;
          const x=Math.log10(freq/20)/Math.log10(1000)*W, y=H-(data[k]/255)*(H-4);
          if(first){ctx.moveTo(x,H);ctx.lineTo(x,y);first=false;}else ctx.lineTo(x,y);
        }
        ctx.lineTo(W,H); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      const colors=['#4488ff','#FFD700','#ff3355','#00e87a'];
      bands.forEach((b,bi)=>{
        const bd=EQ_BANDS[bi],ft=b.filterType||bd.type,q=b.q||1.0;
        ctx.strokeStyle=colors[bi]+'66';ctx.lineWidth=1;ctx.setLineDash([3,4]);ctx.beginPath();
        for(let px=0;px<W;px++){
          const freq=20*Math.pow(1000,px/W);let db=0;
          if(ft==='peaking'){const bw=freq/b.f-b.f/freq;db=b.g/(1+Math.pow(bw*q,2));}
          else if(ft==='lowshelf')db=b.g/(1+Math.pow(freq/b.f,2));
          else if(ft==='highshelf')db=b.g/(1+Math.pow(b.f/freq,2));
          else if(ft==='highpass')db=-12*Math.log2(1+Math.pow(b.f/Math.max(freq,1),b.slope||0.7)*b.slope);
          else if(ft==='lowpass')db=-12*Math.log2(1+Math.pow(freq/b.f,b.slope||0.7)*b.slope);
          const y=H/2-Math.max(-14,Math.min(14,db))/14*(H/2-8);
          px===0?ctx.moveTo(0,y):ctx.lineTo(px,y);
        }
        ctx.stroke();ctx.setLineDash([]);
      });
      ctx.strokeStyle=C.y;ctx.lineWidth=2.5;ctx.shadowColor=C.y;ctx.shadowBlur=6;ctx.beginPath();
      for(let px=0;px<W;px++){
        const freq=20*Math.pow(1000,px/W);let db=0;
        bands.forEach((b,bi)=>{
          const bd=EQ_BANDS[bi],ft=b.filterType||bd.type,q=b.q||1.0;
          if(ft==='peaking'){const bw=freq/b.f-b.f/freq;db+=b.g/(1+Math.pow(bw*q,2));}
          else if(ft==='lowshelf')db+=b.g/(1+Math.pow(freq/b.f,2));
          else if(ft==='highshelf')db+=b.g/(1+Math.pow(b.f/freq,2));
          else if(ft==='highpass')db+=-12*Math.log2(1+Math.pow(b.f/Math.max(freq,1),b.slope||0.7)*b.slope);
          else if(ft==='lowpass')db+=-12*Math.log2(1+Math.pow(freq/b.f,b.slope||0.7)*b.slope);
        });
        const y=H/2-Math.max(-14,Math.min(14,db))/14*(H/2-8);
        px===0?ctx.moveTo(0,y):ctx.lineTo(px,y);
      }
      ctx.stroke();ctx.shadowBlur=0;
      if(analyser)rafRef.current=requestAnimationFrame(drawFrame);
    };
    cancelAnimationFrame(rafRef.current); drawFrame();
    return ()=>cancelAnimationFrame(rafRef.current);
  },[bands,analyser]);

  return <canvas ref={ref} style={{ width:'100%', height:200, display:'block', borderRadius:6, border:'1px solid '+C.borderLit }} />;
}

// ── Main component ──
export default function StudentMixer({ channels: chs }) {
  const [strips,  setStrips]  = useState(() => chs.map(mkStrip));
  const [auxMs,   setAuxMs]   = useState([mkAuxM('Delay'), mkAuxM('Reverb'), mkAuxM('Chorus')]);
  const [playing,  setPlaying]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [paused,   setPaused]   = useState(false);
  const [loopOn,   setLoopOn]   = useState(true);
  const [eqIdx,    setEqIdx]    = useState(null);
  const [vus,      setVus]      = useState(Array(16).fill(0));
  const [analyserOn,   setAnalyserOn]   = useState(true);
  const [analyserMode, setAnalyserMode] = useState('POST');
  const [dispMode,     setDispMode]     = useState('FULL'); // 'FULL' | 'MIX' | 'FADER'
  // tape state
  const [tapeOpen,    setTapeOpen]    = useState(false);
  const [recording,   setRecording]   = useState(false);
  const [tapeUrl,     setTapeUrl]     = useState(null);
  const [tapePlaying, setTapePlaying] = useState(false);
  const [monitor,     setMonitor]     = useState('MIXER');
  const [recSec,      setRecSec]      = useState(0);

  const actxRef    = useRef(null); const nodesRef   = useRef({});
  const auxBusRef  = useRef([]);   const auxRetRef  = useRef([]);
  const sendRef    = useRef({});   const decodedRef = useRef({});
  const animRef    = useRef();     const stripsRef  = useRef(strips);
  const masterRef  = useRef(null); const loopRef    = useRef(true);
  const mediaRecRef   = useRef(null);
  const tapeAudioRef  = useRef(new Audio());
  const tapeBlobRef   = useRef(null);
  const playOffsetRef = useRef(0);
  const recTimerRef   = useRef(null);

  useEffect(() => { stripsRef.current = strips; }, [strips]);
  useEffect(() => { loopRef.current = loopOn; }, [loopOn]);

  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = '@keyframes reelSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes recBlink{0%,100%{opacity:1}50%{opacity:0.2}}';
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  const getCtx = () => {
    if (!actxRef.current) actxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (actxRef.current.state === 'suspended') actxRef.current.resume();
    return actxRef.current;
  };

  const buildFx = (ctx, type, p) => {
    if (type === 'Delay') {
      const inp=ctx.createGain(),del=ctx.createDelay(2),fb=ctx.createGain(),wet=ctx.createGain(),dry=ctx.createGain(),out=ctx.createGain();
      del.delayTime.value=p.time||.4;fb.gain.value=p.fb||.4;wet.gain.value=p.mix||.6;dry.gain.value=1-(p.mix||.6);
      inp.connect(del);del.connect(fb);fb.connect(del);del.connect(wet);inp.connect(dry);wet.connect(out);dry.connect(out);return{inp,out};
    }
    if (type === 'Reverb') {
      const dec=p.decay||2.5,len=Math.floor(ctx.sampleRate*dec),ir=ctx.createBuffer(2,len,ctx.sampleRate);
      for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2);}
      const conv=ctx.createConvolver();conv.buffer=ir;
      const wet=ctx.createGain(),dry=ctx.createGain(),inp=ctx.createGain(),out=ctx.createGain();
      wet.gain.value=p.mix||.65;dry.gain.value=1-(p.mix||.65);
      inp.connect(conv);conv.connect(wet);inp.connect(dry);wet.connect(out);dry.connect(out);return{inp,out};
    }
    if (type === 'Chorus') {
      const inp=ctx.createGain(),del=ctx.createDelay(.05),lfo=ctx.createOscillator(),lfoG=ctx.createGain(),wet=ctx.createGain(),dry=ctx.createGain(),out=ctx.createGain();
      del.delayTime.value=.022;lfo.frequency.value=p.rate||1;lfoG.gain.value=(p.depth||.5)*.01;
      wet.gain.value=p.mix||.5;dry.gain.value=1-(p.mix||.5);
      lfo.connect(lfoG);lfoG.connect(del.delayTime);inp.connect(del);del.connect(wet);inp.connect(dry);wet.connect(out);dry.connect(out);lfo.start();return{inp,out};
    }
    const inp=ctx.createGain(),del=ctx.createDelay(.02),lfo=ctx.createOscillator(),lfoG=ctx.createGain(),fb=ctx.createGain(),wet=ctx.createGain(),dry=ctx.createGain(),out=ctx.createGain();
    del.delayTime.value=.005;lfo.frequency.value=p.rate||.5;lfoG.gain.value=(p.depth||.5)*.003;fb.gain.value=p.fb||.4;
    wet.gain.value=p.mix||.5;dry.gain.value=1-(p.mix||.5);
    lfo.connect(lfoG);lfoG.connect(del.delayTime);inp.connect(del);del.connect(fb);fb.connect(del);del.connect(wet);inp.connect(dry);wet.connect(out);dry.connect(out);lfo.start();return{inp,out};
  };

  const startVuLoop = () => {
    const draw = () => {
      const s = stripsRef.current;
      setVus(Array.from({length:16},(_,i)=>(!nodesRef.current[i]||s[i]&&s[i].mute)?0:s[i]?s[i].fader*(0.2+Math.random()*.9):0));
      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
  };

  const stopAll = () => {
    cancelAnimationFrame(animRef.current);
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      mediaRecRef.current.stop();
    }
    clearInterval(recTimerRef.current);
    Object.values(nodesRef.current).forEach(n => { try { n.src.stop(); } catch (e) {} });
    nodesRef.current = {}; sendRef.current = {};
    masterRef.current = null;
    setPlaying(false); setPaused(false); setVus(Array(16).fill(0));
  };

  const startPlay = async (offset = 0, record = false) => {
    const loaded = chs.filter(c => c.audioUrl).length; if (!loaded) return;
    setLoading(true);
    try {
      const ctx = getCtx();
      const master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
      masterRef.current = master;

      if (record) {
        const msDest = ctx.createMediaStreamDestination();
        master.connect(msDest);
        const chunks = [];
        const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
        const mr = new MediaRecorder(msDest.stream, { mimeType: mime });
        mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        mr.onstop = () => {
          const blob = new Blob(chunks, { type: mr.mimeType });
          tapeBlobRef.current = blob;
          if (tapeUrl) URL.revokeObjectURL(tapeUrl);
          const url = URL.createObjectURL(blob);
          setTapeUrl(url);
          setRecording(false);
          clearInterval(recTimerRef.current);
        };
        mr.start(100);
        mediaRecRef.current = mr;
        setRecording(true);
        setRecSec(0);
        recTimerRef.current = setInterval(() => setRecSec(s => s + 1), 1000);
      }

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
        const buf = decodedRef.current[ch.audioUrl];
        const src = ctx.createBufferSource(); src.buffer = buf; src.loop = loopRef.current;
        const gainDbNode = ctx.createGain(); gainDbNode.gain.value = Math.pow(10, (s.gain || 0) / 20);
        src.connect(gainDbNode);
        let prev = gainDbNode;
        const analyserPre = ctx.createAnalyser(); analyserPre.fftSize = 2048; analyserPre.smoothingTimeConstant = 0.8;
        gainDbNode.connect(analyserPre);
        const eqNodes = EQ_BANDS.map((b, bi) => {
          const f = ctx.createBiquadFilter(); f.type = s.eq[bi].filterType || b.type;
          f.frequency.value = s.eq[bi].f; f.gain.value = s.eq[bi].g; f.Q.value = s.eq[bi].q || 1.0;
          prev.connect(f); prev = f; return f;
        });
        const analyserPost = ctx.createAnalyser(); analyserPost.fftSize = 2048; analyserPost.smoothingTimeConstant = 0.8;
        prev.connect(analyserPost);
        const gainN = ctx.createGain(); gainN.gain.value = s.fader; prev.connect(gainN);
        const panN  = ctx.createStereoPanner(); panN.pan.value = s.pan; gainN.connect(panN); panN.connect(master);
        if (!sendRef.current[i]) sendRef.current[i] = [];
        s.sends.forEach((sv, j) => { const sn = ctx.createGain(); sn.gain.value = sv; gainN.connect(sn); sn.connect(auxBusRef.current[j]); sendRef.current[i][j] = sn; });
        src.start(0, offset % (buf.duration || 1));
        nodesRef.current[i] = { src, gainDbNode, gainN, panN, eqNodes, analyserPre, analyserPost };
      }));

      setPlaying(true);
      startVuLoop();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const playAll = async () => {
    if (playing) { stopAll(); return; }
    await startPlay(playOffsetRef.current, false);
  };

  const pauseResume = () => {
    const ctx = actxRef.current;
    if (!ctx || !playing) return;
    if (ctx.state === 'running') {
      ctx.suspend().then(() => { setPaused(true); cancelAnimationFrame(animRef.current); });
    } else {
      ctx.resume().then(() => { setPaused(false); startVuLoop(); });
    }
  };

  const seekFwd = () => {
    playOffsetRef.current += 10;
    if (playing) { stopAll(); setTimeout(() => startPlay(playOffsetRef.current), 50); }
  };

  const seekRwd = () => {
    playOffsetRef.current = Math.max(0, playOffsetRef.current - 10);
    if (playing) { stopAll(); setTimeout(() => startPlay(playOffsetRef.current), 50); }
  };

  const toggleLoop = () => {
    const next = !loopOn;
    setLoopOn(next);
    Object.values(nodesRef.current).forEach(n => { if (n.src) n.src.loop = next; });
  };

  const startRec = async () => {
    stopAll();
    playOffsetRef.current = 0;
    setTapeOpen(true);
    setTapePlaying(false);
    await new Promise(r => setTimeout(r, 80));
    await startPlay(0, true);
  };

  const stopRec = () => {
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') mediaRecRef.current.stop();
    stopAll();
    clearInterval(recTimerRef.current);
    setRecording(false);
  };

  const playTape = () => {
    if (!tapeUrl) return;
    const audio = tapeAudioRef.current;
    audio.src = tapeUrl;
    audio.volume = 1;
    audio.onended = () => setTapePlaying(false);
    audio.play();
    setTapePlaying(true);
  };

  const stopTape = () => {
    tapeAudioRef.current.pause();
    tapeAudioRef.current.currentTime = 0;
    setTapePlaying(false);
    if (masterRef.current) masterRef.current.gain.value = 1;
  };

  const exportMix = () => {
    if (!tapeUrl) return;
    const a = document.createElement('a');
    a.href = tapeUrl;
    a.download = 'mix_' + new Date().toISOString().slice(0,19).replace(/[:.]/g,'-') + '.webm';
    a.click();
  };

  const switchMonitor = (mode) => {
    setMonitor(mode);
    if (mode === 'TAPE') {
      if (masterRef.current) masterRef.current.gain.value = 0;
      if (tapeAudioRef.current) tapeAudioRef.current.volume = 1;
    } else {
      if (masterRef.current) masterRef.current.gain.value = 1;
      if (tapeAudioRef.current) tapeAudioRef.current.volume = 0;
    }
  };

  const setFaderV  = (i, v) => { setStrips(s => s.map((x,k)=>k===i?{...x,fader:v}:x)); if(nodesRef.current[i])nodesRef.current[i].gainN.gain.value=v; };
  const setGainDb  = (i, v) => { setStrips(s => s.map((x,k)=>k===i?{...x,gain:v}:x));  if(nodesRef.current[i]?.gainDbNode)nodesRef.current[i].gainDbNode.gain.value=Math.pow(10,v/20); };
  const setPanV    = (i, v) => { setStrips(s => s.map((x,k)=>k===i?{...x,pan:v}:x));   if(nodesRef.current[i])nodesRef.current[i].panN.pan.value=v; };
  const toggleMute = i      => setStrips(s => s.map((x,k)=>{ if(k!==i)return x; const m=!x.mute; if(nodesRef.current[i])nodesRef.current[i].gainN.gain.value=m?0:x.fader; return{...x,mute:m}; }));
  const setSend    = (i,j,v) => { setStrips(s=>s.map((x,k)=>k===i?{...x,sends:x.sends.map((sv,sj)=>sj===j?v:sv)}:x)); if(sendRef.current[i]?.[j])sendRef.current[i][j].gain.value=v; };
  const setEqBand  = (i, bi, field, v) => {
    setStrips(s=>s.map((x,k)=>k===i?{...x,eq:x.eq.map((b,bj)=>bj===bi?{...b,[field]:v}:b)}:x));
    const en=nodesRef.current[i]?.eqNodes?.[bi];
    if(en){if(field==='g')en.gain.value=v;if(field==='f')en.frequency.value=v;if(field==='q')en.Q.value=v;if(field==='filterType')en.type=v;if(field==='slope')en.Q.value=v;}
  };
  const setAuxReturn = (j,v) => { setAuxMs(a=>a.map((x,k)=>k===j?{...x,rl:v}:x)); if(auxRetRef.current[j])auxRetRef.current[j].gain.value=v; };
  const cycleAuxType = j     => { if(playing)stopAll(); setAuxMs(a=>a.map((x,k)=>{ if(k!==j)return x; const nt=AUX_FX_OPTS[(AUX_FX_OPTS.indexOf(x.type)+1)%AUX_FX_OPTS.length]; return mkAuxM(nt,x.rl); })); };

  useEffect(() => () => {
    stopAll();
    tapeAudioRef.current.pause();
    if (tapeUrl) URL.revokeObjectURL(tapeUrl);
    try { actxRef.current && actxRef.current.close(); } catch (e) {}
  }, []);

  const loaded = chs.filter(c => c.audioUrl).length;
  const tBtnS = (active, color) => ({ padding:'6px 14px', fontSize:11, fontWeight:800, cursor:'pointer', borderRadius:5, letterSpacing:1, border:'1px solid '+(active?color:C.borderLit), background:active?color+'22':C.dim, color:active?color:C.muted, transition:'all .15s' });

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:10, flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:C.y, margin:'0 0 2px' }}>🎚️ מיקסר — 16 ערוצים</h1>
          <p style={{ color:C.muted, margin:0, fontSize:12 }}>{loaded+' ערוצים עם אודיו · '+(recording?'⏺ מקליט':playing?(paused?'⏸ מושהה':'● מנגן'):'מושהה')}</p>
        </div>
      </div>

      {/* ── Transport Panel ── */}
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12, padding:'10px 14px', background:'#0a0a0a', borderRadius:10, border:'1px solid '+C.borderLit, flexWrap:'wrap' }}>
        <span style={{ fontSize:9, color:C.muted, letterSpacing:2, marginLeft:4, fontFamily:'monospace' }}>TRANSPORT</span>
        <div style={{ width:1, height:24, background:C.borderLit, margin:'0 4px' }} />

        {/* RWD */}
        <button onClick={seekRwd}
          style={{ ...tBtnS(false,'#aaa'), padding:'6px 11px' }} title="Rewind 10s">
          ◀◀
        </button>

        {/* PLAY / RESUME */}
        <button onClick={paused ? pauseResume : playAll} disabled={loading || loaded===0}
          style={{ ...tBtnS(playing&&!paused, C.green), padding:'6px 18px', fontSize:13 }}>
          {loading ? '⏳' : (playing && !paused) ? '▶ PLAY' : paused ? '▶ RESUME' : '▶ PLAY'}
        </button>

        {/* PAUSE */}
        <button onClick={pauseResume} disabled={!playing}
          style={{ ...tBtnS(paused, C.y) }}>
          ⏸ PAUSE
        </button>

        {/* STOP */}
        <button onClick={stopAll} disabled={!playing && !recording}
          style={{ ...tBtnS(false, C.red) }}>
          ■ STOP
        </button>

        {/* FWD */}
        <button onClick={seekFwd}
          style={{ ...tBtnS(false,'#aaa'), padding:'6px 11px' }} title="Forward 10s">
          ▶▶
        </button>

        <div style={{ width:1, height:24, background:C.borderLit, margin:'0 4px' }} />

        {/* LOOP */}
        <button onClick={toggleLoop}
          style={{ ...tBtnS(loopOn, C.blue) }}>
          🔁 LOOP
        </button>

        <div style={{ width:1, height:24, background:C.borderLit, margin:'0 4px' }} />

        {/* TAPE */}
        <button onClick={() => setTapeOpen(o => !o)}
          style={{ ...tBtnS(tapeOpen || recording, '#ff4444'), padding:'6px 16px' }}>
          {recording
            ? <span style={{ animation:'recBlink 1s infinite' }}>⏺ REC {fmtTime(recSec)}</span>
            : '⏺ TAPE'}
        </button>
      </div>

      {/* ── Studer A820 Tape Machine ── */}
      {tapeOpen && (() => {
        const vuAvg = vus.reduce((a,v)=>a+v,0)/vus.length;
        const vuL = vus.filter((_,i)=>i%2===0).reduce((a,v)=>a+v,0)/8;
        const vuR = vus.filter((_,i)=>i%2===1).reduce((a,v)=>a+v,0)/8;
        return (
          <div style={{ marginBottom:14, background:'linear-gradient(180deg,#242424 0%,#1a1a1a 100%)', border:'1px solid #3a3a3a', borderTop:'1px solid #505050', borderRadius:12, padding:'0 0 18px', overflow:'hidden', boxShadow:'0 12px 60px rgba(0,0,0,.95), inset 0 1px 0 rgba(255,255,255,0.06)' }}>

            {/* ── Top nameplate bar ── */}
            <div style={{ background:'linear-gradient(180deg,#2e2e2e,#222)', borderBottom:'1px solid #333', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
                <span style={{ fontSize:22, fontWeight:900, color:'#cc1111', fontFamily:'serif', letterSpacing:4, textShadow:'0 0 18px #cc111166' }}>STUDER</span>
                <span style={{ fontSize:9, color:'#666', fontFamily:'monospace', letterSpacing:3 }}>A820 MULTITRACK</span>
                <div style={{ width:7, height:7, borderRadius:'50%', background:recording?'#ff2222':(tapePlaying?'#22cc44':'#333'), boxShadow:recording?'0 0 8px #ff222299':(tapePlaying?'0 0 8px #22cc4499':'none'), marginLeft:6 }} />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                {/* Monitor selector */}
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ fontSize:7, color:'#555', fontFamily:'monospace', letterSpacing:2 }}>INPUT</span>
                  <div style={{ display:'flex', borderRadius:4, overflow:'hidden', border:'1px solid #3a3a3a' }}>
                    {['MIXER','TAPE'].map(m=>(
                      <button key={m} onClick={()=>switchMonitor(m)} style={{ padding:'4px 10px', fontSize:8, fontWeight:800, cursor:'pointer', letterSpacing:1.5, fontFamily:'monospace', background:monitor===m?'#cc1111':('#181818'), color:monitor===m?'#fff':'#555', border:'none', transition:'all .12s' }}>{m}</button>
                    ))}
                  </div>
                </div>
                <button onClick={()=>setTapeOpen(false)} style={{ background:'transparent', border:'1px solid #3a3a3a', color:'#555', cursor:'pointer', fontSize:13, borderRadius:4, padding:'2px 8px', lineHeight:1 }}>✕</button>
              </div>
            </div>

            {/* ── Main panel ── */}
            <div style={{ padding:'16px 20px 0', display:'flex', gap:16, alignItems:'flex-start' }}>

              {/* Left reel + label */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ fontSize:7, color:'#444', fontFamily:'monospace', letterSpacing:2 }}>SUPPLY</div>
                <Reel size={120} spinning={recording || tapePlaying} />
              </div>

              {/* Center section */}
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>

                {/* Tape path with head block */}
                <div style={{ background:'#111', border:'1px solid #2a2a2a', borderRadius:6, padding:'8px 10px', display:'flex', alignItems:'center', gap:8, position:'relative', overflow:'hidden' }}>
                  {(recording||tapePlaying) && (
                    <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(90deg,#1e1000 0,#1e1000 28px,#160b00 28px,#160b00 56px)', animation:'reelSpin 1.2s linear infinite', backgroundSize:'56px 100%', opacity:.4 }} />
                  )}
                  {/* Tape guides + heads */}
                  {['',  '','','',''].map((_,k) => (
                    <div key={k} style={{ position:'relative', zIndex:1, width: k===2?14:8, height: k===2?28:18, background: k===2?'#444':'#2c2c2c', borderRadius:2, border:'1px solid '+(k===2?'#686868':'#383838'), flexShrink:0 }} />
                  ))}
                  <div style={{ flex:1 }} />
                  {/* Capstan */}
                  <div style={{ width:10, height:32, background:'#555', borderRadius:5, border:'1px solid #777', position:'relative', zIndex:1, flexShrink:0 }} />
                </div>

                {/* Counter + status LED display */}
                <div style={{ background:'#080808', border:'1px solid #222', borderRadius:6, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontFamily:'"Courier New",monospace', fontSize:28, fontWeight:900, color:'#22ee66', letterSpacing:6, textShadow:'0 0 12px #22ee6688' }}>
                    {fmtTime(recSec)}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    {recording ? (
                      <div style={{ fontSize:10, color:'#ff3333', fontFamily:'monospace', letterSpacing:2, animation:'recBlink 1s infinite' }}>⏺ REC</div>
                    ) : tapePlaying ? (
                      <div style={{ fontSize:10, color:'#22dd55', fontFamily:'monospace', letterSpacing:2 }}>▶ PLAY</div>
                    ) : tapeUrl ? (
                      <div style={{ fontSize:10, color:'#555', fontFamily:'monospace', letterSpacing:2 }}>READY</div>
                    ) : (
                      <div style={{ fontSize:10, color:'#333', fontFamily:'monospace', letterSpacing:2 }}>NO TAPE</div>
                    )}
                  </div>
                </div>

                {/* VU Meters */}
                <div style={{ background:'#0a0a0a', border:'1px solid #1e1e1e', borderRadius:6, padding:'10px 14px', display:'flex', gap:18, justifyContent:'center' }}>
                  <StVU level={playing||tapePlaying ? vuL : 0} label="L" />
                  <StVU level={playing||tapePlaying ? vuR : 0} label="R" />
                </div>

                {/* Transport buttons */}
                <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
                  <StBtn icon="◀◀" label="REW"    color="#aaaaaa" onClick={seekRwd} />
                  <StBtn icon="■"   label="STOP"   color="#cccccc" active={!playing&&!recording&&!tapePlaying} onClick={()=>{stopRec();stopTape();}} />
                  <StBtn icon="▶"   label="PLAY"   color="#22dd55" active={tapePlaying} disabled={!tapeUrl||recording} onClick={tapePlaying?stopTape:playTape} wide />
                  <StBtn icon="▶▶" label="FF"      color="#aaaaaa" onClick={seekFwd} />
                  <StBtn icon="⏺"  label="REC"    color="#ff3333" active={recording} disabled={recording} onClick={startRec} />
                  <StBtn icon="⬇"  label="EXPORT" color="#44aaff" disabled={!tapeUrl} onClick={exportMix} />
                </div>

                {tapeUrl && !recording && (
                  <div style={{ textAlign:'center', fontSize:9, color:'#3a3a3a', fontFamily:'monospace', letterSpacing:1 }}>
                    ⚠ NEW RECORDING WILL OVERWRITE SAVED MIX
                  </div>
                )}
              </div>

              {/* Right reel + label */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ fontSize:7, color:'#444', fontFamily:'monospace', letterSpacing:2 }}>TAKE-UP</div>
                <Reel size={120} spinning={recording || tapePlaying} />
              </div>

            </div>

            {/* Bottom badge */}
            <div style={{ textAlign:'center', marginTop:14, fontSize:7, color:'#2e2e2e', fontFamily:'monospace', letterSpacing:4 }}>STUDER REVOX AG · REGENSDORF-WATT · SWITZERLAND</div>
          </div>
        );
      })()}

      {/* ── AUX Masters ── */}
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        {auxMs.map((a, j) => (
          <div key={j} style={{ flex:'1 1 210px', background:C.card, borderRadius:9, border:'1px solid '+(a.open?AUX_COLORS[j]+'55':C.borderLit), overflow:'hidden' }}>
            <div style={{ padding:'8px 12px', display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ fontSize:11, fontWeight:900, color:AUX_COLORS[j], flexShrink:0, width:46 }}>{'AUX '+(j+1)}</span>
              <div style={{ background:'#0a0a0a', border:'1px solid '+AUX_COLORS[j]+'44', borderRadius:4, padding:'2px 8px', fontSize:11, fontFamily:'monospace', color:AUX_COLORS[j], flex:1, textAlign:'center' }}>{a.type}</div>
              <Knob val={a.rl} min={0} max={1} onChange={v=>setAuxReturn(j,v)} label="RTN" size={28} color={AUX_COLORS[j]} />
              <button onClick={()=>cycleAuxType(j)} style={{ width:28,height:28,background:'transparent',color:C.blue,border:'1px solid '+C.blue,borderRadius:5,cursor:'pointer',fontSize:14,fontWeight:700,flexShrink:0 }}>⇄</button>
              <button onClick={()=>setAuxMs(ax=>ax.map((x,k)=>k===j?{...x,open:!x.open}:x))}
                style={{ padding:'3px 10px',background:a.open?AUX_COLORS[j]+'22':'transparent',color:a.open?AUX_COLORS[j]:C.muted,border:'1px solid '+(a.open?AUX_COLORS[j]:C.borderLit),borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:700,flexShrink:0 }}>
                {a.open?'▲':'▼ עריכה'}
              </button>
            </div>
            {a.open && (
              <div style={{ padding:'12px 16px', background:'#0a0a0a', borderTop:'1px solid '+C.dim }}>
                <div style={{ fontSize:10, color:AUX_COLORS[j], fontWeight:700, marginBottom:10, letterSpacing:.5 }}>{a.type+' · AUX '+(j+1)+' Parameters'}</div>
                <div style={{ display:'flex', gap:28, alignItems:'center', flexWrap:'wrap' }}>
                  {(AUX_FX_PARAMS[a.type]||[]).map(pr=>(
                    <Knob key={pr.k} val={a.params[pr.k]!=null?a.params[pr.k]:pr.mn} min={pr.mn} max={pr.mx}
                      onChange={v=>setAuxMs(ax=>ax.map((x,i)=>i===j?{...x,params:{...x.params,[pr.k]:v}}:x))}
                      label={pr.l} size={52} color={AUX_COLORS[j]} />
                  ))}
                </div>
                {playing&&<div style={{ marginTop:8,fontSize:10,color:C.muted }}>⚠ שינויים יכנסו לתוקף בהפעלה הבאה</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Console display-mode bar ── */}
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6, padding:'7px 12px', background:'#090909', borderRadius:8, border:'1px solid '+C.borderLit, flexWrap:'wrap' }}>
        <span style={{ fontSize:9, color:C.muted, fontFamily:'monospace', letterSpacing:2, marginLeft:2 }}>VIEW</span>
        <div style={{ width:1, height:18, background:C.borderLit }} />
        {[['FULL','כולל Sends + Gain'],['MIX','Gain + EQ בלי Sends'],['FADER','פיידר בלבד']].map(([m,tip])=>(
          <button key={m} onClick={()=>setDispMode(m)} title={tip}
            style={{ ...tBtnS(dispMode===m, C.y), padding:'4px 13px', fontSize:9 }}>{m}</button>
        ))}
        <div style={{ width:1, height:18, background:C.borderLit, marginLeft:'auto' }} />
        <span style={{ fontSize:9, color:C.muted, fontFamily:'monospace' }}>{chs.filter(c=>c.audioUrl).length} / 16 loaded</span>
      </div>

      {/* ── Console ── */}
      <div style={{ background:'#040404', border:'2px solid #181818', borderRadius:14, padding:'12px 8px 8px', overflowX:'auto', boxShadow:'inset 0 4px 24px rgba(0,0,0,.9)' }}>
        <div style={{ display:'flex', gap:2, minWidth: 16*84+15*2 }}>
          {chs.map((ch, i) => {
            const s=strips[i], isM=i===15;
            const FH = 160;
            return (
              <div key={i} style={{ width:84, background:isM?'linear-gradient(180deg,#1e1800,#100d00)':'linear-gradient(180deg,#181818,#0d0d0d)', border:'1px solid '+(isM?C.yDim:'#1c1c1c'), borderRadius:7, padding:'7px 4px 6px', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>

                {/* Channel name */}
                <div style={{ fontSize:11, fontWeight:800, color:isM?C.y:'#aaa', width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', padding:'0 3px', letterSpacing:.3 }}>{ch.name}</div>

                {/* EQ button */}
                {dispMode !== 'FADER' && (
                  <button onClick={()=>setEqIdx(eqIdx===i?null:i)}
                    style={{ width:56, height:15, background:eqIdx===i?C.y+'2a':'#0e0e0e', color:eqIdx===i?C.y:'#3a3a3a', border:'1px solid '+(eqIdx===i?C.y+'44':'#1c1c1c'), borderRadius:3, cursor:'pointer', fontSize:8, fontWeight:700, letterSpacing:1 }}>
                    4B · EQ
                  </button>
                )}

                {/* GAIN knob */}
                {dispMode !== 'FADER' && (
                  <Knob val={s.gain} min={-20} max={12}
                    onChange={v=>setGainDb(i, Math.round(v*2)/2)}
                    label={(s.gain>0?'+':'')+s.gain.toFixed(0)+'dB'}
                    size={30} color={s.gain > 0 ? '#ff9944' : s.gain < 0 ? '#44aaff' : '#555'} />
                )}

                {/* Sends A1/A2/A3 */}
                {dispMode === 'FULL' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:3, width:'100%', alignItems:'center', padding:'2px 0' }}>
                    {[0,1,2].map(j=>(
                      <div key={j} style={{ display:'flex', alignItems:'center', gap:3, width:'100%', justifyContent:'center' }}>
                        <div style={{ fontSize:7, color:AUX_COLORS[j], fontWeight:700, width:14, textAlign:'right', flexShrink:0 }}>{'A'+(j+1)}</div>
                        <Knob val={s.sends[j]} min={0} max={1} onChange={v=>setSend(i,j,v)} label="" size={22} color={AUX_COLORS[j]} />
                      </div>
                    ))}
                  </div>
                )}

                {/* PAN */}
                <Knob val={s.pan} min={-1} max={1} onChange={v=>setPanV(i,v)} label="PAN" size={28} color={C.green} />

                {/* VU + Fader */}
                <div style={{ display:'flex', gap:3, alignItems:'flex-end' }}>
                  <VU level={playing&&s&&!s.mute?vus[i]:0} ht={FH} />
                  <Fader val={s.fader} onChange={v=>setFaderV(i,v)} ht={FH} />
                </div>

                {/* MUTE */}
                <button onClick={()=>toggleMute(i)}
                  style={{ width:56, padding:'3px 0', background:s.mute?C.red:'#0e0e0e', color:s.mute?'#fff':C.muted, border:'1px solid '+(s.mute?C.red:'#1c1c1c'), borderRadius:3, fontSize:8, fontWeight:700, cursor:'pointer', letterSpacing:.5 }}>
                  MUTE
                </button>

                {/* Instrument icon */}
                {ch.instrument&&(()=>{const inst=INSTRUMENTS.find(x=>x.id===ch.instrument);return inst?<span title={inst.label} style={{fontSize:14,lineHeight:1}}>{inst.icon}</span>:null;})()}
              </div>
            );
          })}
        </div>
        <div style={{ textAlign:'center', marginTop:8, color:'#141414', fontSize:8, letterSpacing:3, fontFamily:'monospace', fontWeight:700 }}>SOUND ACADEMY · TLA SERIES · 16CH ANALOG CONSOLE</div>
      </div>

      {/* ── EQ Panel ── */}
      {eqIdx!==null&&strips[eqIdx]&&(
        <div style={{ marginTop:10, background:C.card, borderRadius:10, border:'1px solid '+C.y+'44', padding:'14px 18px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ fontWeight:900, color:C.y, fontSize:14 }}>{'📈 4-Band Semi-Parametric EQ — '+(chs[eqIdx]?.name||('Ch '+(eqIdx+1)))}</div>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <button onClick={()=>setAnalyserOn(o=>!o)}
                style={{ padding:'3px 9px', fontSize:9, fontWeight:800, cursor:'pointer', borderRadius:4, letterSpacing:1, background:analyserOn?'rgba(80,180,255,0.15)':C.dim, color:analyserOn?'#50b4ff':C.muted, border:'1px solid '+(analyserOn?'#50b4ff55':C.borderLit) }}>
                ANLZR
              </button>
              {analyserOn&&['PRE','POST'].map(m=>(
                <button key={m} onClick={()=>setAnalyserMode(m)}
                  style={{ padding:'3px 7px', fontSize:9, fontWeight:800, cursor:'pointer', borderRadius:4, background:analyserMode===m?'rgba(80,180,255,0.2)':C.dim, color:analyserMode===m?'#50b4ff':C.muted, border:'1px solid '+(analyserMode===m?'#50b4ff55':C.borderLit) }}>{m}</button>
              ))}
              <button onClick={()=>setEqIdx(null)} style={{ background:'transparent', border:'1px solid '+C.borderLit, color:C.muted, cursor:'pointer', fontSize:14, borderRadius:6, padding:'3px 9px' }}>✕</button>
            </div>
          </div>
          <EQCurve bands={strips[eqIdx].eq} analyser={analyserOn?(analyserMode==='PRE'?nodesRef.current[eqIdx]?.analyserPre:nodesRef.current[eqIdx]?.analyserPost):null} />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:12 }}>
            {[...EQ_BANDS].reverse().map((band, ri) => {
              const bi=EQ_BANDS.length-1-ri, eq=strips[eqIdx].eq[bi], bColor=[C.blue,C.y,C.red,C.green][bi];
              const filterOpts=bi===0?LOW_FILTER_TYPES:bi===3?HIGH_FILTER_TYPES:null;
              const curFt=eq.filterType||band.type, isFilter=curFt==='highpass'||curFt==='lowpass';
              return (
                <div key={bi} style={{ background:C.panel, borderRadius:8, padding:'12px 8px', border:'1px solid '+bColor+'33', display:'flex', flexDirection:'column', alignItems:'center', gap:7 }}>
                  <span style={{ fontSize:11, fontWeight:900, color:bColor, letterSpacing:1 }}>{band.lbl}</span>
                  {filterOpts&&(
                    <div style={{ display:'flex', gap:3, flexWrap:'wrap', justifyContent:'center' }}>
                      {filterOpts.map(ft=>(
                        <button key={ft} onClick={()=>setEqBand(eqIdx,bi,'filterType',ft)}
                          style={{ padding:'2px 7px', fontSize:9, fontWeight:700, cursor:'pointer', borderRadius:4, background:curFt===ft?bColor:C.dim, color:curFt===ft?'#000':C.muted, border:'1px solid '+(curFt===ft?bColor:C.borderLit) }}>
                          {FILTER_LABELS[ft]||ft}
                        </button>
                      ))}
                    </div>
                  )}
                  {filterOpts&&isFilter&&(
                    <div style={{ display:'flex', gap:3, justifyContent:'center' }}>
                      {SLOPE_OPTS.map(sl=>(
                        <button key={sl.l} onClick={()=>setEqBand(eqIdx,bi,'slope',sl.v)}
                          style={{ padding:'2px 6px', fontSize:9, fontWeight:700, cursor:'pointer', borderRadius:4, background:Math.abs((eq.slope||0.7)-sl.v)<0.1?bColor:C.dim, color:Math.abs((eq.slope||0.7)-sl.v)<0.1?'#000':C.muted, border:'1px solid '+(Math.abs((eq.slope||0.7)-sl.v)<0.1?bColor:C.borderLit) }}>
                          {sl.l}
                        </button>
                      ))}
                    </div>
                  )}
                  {!isFilter&&(
                    <Knob val={eq.g} min={-12} max={12} onChange={v=>setEqBand(eqIdx,bi,'g',v)} label={(eq.g>=0?'+':'')+eq.g.toFixed(1)+'dB'} size={52} color={bColor} />
                  )}
                  {band.hasQ&&(
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                      <span style={{ fontSize:8, color:C.muted, letterSpacing:.5 }}>Q</span>
                      <Knob val={eq.q||1} min={0.1} max={10} onChange={v=>setEqBand(eqIdx,bi,'q',v)} label={'Q '+(eq.q||1).toFixed(1)} size={42} color={bColor} />
                    </div>
                  )}
                  <Knob
                    val={Math.log(eq.f)} min={Math.log(band.fMn)} max={Math.log(band.fMx)}
                    onChange={v=>setEqBand(eqIdx,bi,'f',Math.max(band.fMn,Math.min(band.fMx,Math.round(Math.exp(v)))))}
                    label={eq.f>=1000?(eq.f/1000).toFixed(eq.f>=10000?0:1)+'kHz':eq.f+'Hz'}
                    size={48} color={bColor} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
