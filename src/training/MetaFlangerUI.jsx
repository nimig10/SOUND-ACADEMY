import { useState, useRef, useEffect } from 'react';
import { C } from '../constants.js';

const MF = {
  bg: '#aaaaaa', panel: '#989898', dark: '#7a7a7a', led: '#070707',
  green: '#00ee44', greenDim: '#002200', text: '#111',
  bdr: '1px solid #505050',
  btnU: 'linear-gradient(180deg,#d0d0d0,#8e8e8e)',
  btnD: 'linear-gradient(180deg,#808080,#b8b8b8)',
};

function MFDisp({ val, w = 68 }) {
  const s = typeof val === 'number'
    ? (val >= 100 ? Math.round(val) : val >= 10 ? val.toFixed(1) : val.toFixed(2))
    : val;
  return <div style={{ background: MF.led, border: '2px solid #363636', borderRadius: 2, color: MF.green, fontFamily: 'monospace', fontSize: 13, fontWeight: 700, padding: '2px 5px', minWidth: w, textAlign: 'center', boxShadow: 'inset 0 2px 7px rgba(0,0,0,.95)', letterSpacing: .5 }}>{s}</div>;
}

function MFLED({ on, onClick }) {
  return <div onClick={onClick} style={{ width: 13, height: 13, borderRadius: '50%', background: on ? 'radial-gradient(circle at 38% 32%,#aaffaa,#00bb33)' : MF.greenDim, boxShadow: on ? '0 0 5px #00ee44' : 'none', cursor: 'pointer', border: '1px solid #333', flexShrink: 0 }} />;
}

function MFBtn({ children, active, onClick, style = {} }) {
  return <button onClick={onClick} style={{ background: active ? MF.btnD : MF.btnU, border: MF.bdr, boxShadow: active ? 'inset 1px 1px 3px rgba(0,0,0,.55)' : '1px 1px 0 rgba(255,255,255,.45) inset,-1px -1px 0 rgba(0,0,0,.25) inset', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 11, color: MF.text, fontFamily: 'Arial', ...style }}>{children}</button>;
}

function MFDragNum({ val, min, max, onChange, w = 68 }) {
  const onDown = e => {
    e.preventDefault();
    const sy = e.clientY, sv = val;
    const mv = m => { const nv = sv + (sy - m.clientY) / 90 * (max - min); onChange(Math.max(min, Math.min(max, +nv.toFixed(2)))); };
    const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
  };
  return <div onMouseDown={onDown} style={{ cursor: 'ns-resize', userSelect: 'none' }}><MFDisp val={val} w={w} /></div>;
}

function MFSec({ children, style = {} }) {
  return <div style={{ background: MF.panel, borderLeft: '1px solid #bcbcbc', borderTop: '1px solid #c4c4c4', borderRight: '1px solid #585858', borderBottom: '1px solid #585858', padding: '9px 10px', display: 'flex', flexDirection: 'column', gap: 8, ...style }}>{children}</div>;
}

function MFLbl({ children }) {
  return <div style={{ fontSize: 10, color: MF.text, fontWeight: 700, fontFamily: 'Arial', letterSpacing: .3, marginBottom: 2 }}>{children}</div>;
}

const WAVEFORMS = ['Sine', 'Triangle', 'Sawtooth', 'Square'];

export default function MetaFlangerUI({ usr, setUsr, tgt, phase, res, onNewRound, onSubmit, onPlayTarget, onPlayUser, onStop }) {
  const oscRef  = useRef(); const modRef  = useRef();
  const sterRef = useRef(); const vuLRef  = useRef(); const vuRRef = useRef();
  const animRef = useRef();
  const rateRef = useRef(usr.rate || 2); const depthRef = useRef(usr.depth || 4);
  const wfRef   = useRef('Sine'); const modRunRef = useRef(true);

  const [waveform, setWfSt]  = useState('Sine');
  const [tape,     setTape]  = useState(true);
  const [syncM,    setSyncM] = useState(false);
  const [link,     setLink]  = useState(false);
  const [freqOn,   setFreqOn]= useState(true);
  const [modRun,   setMrSt]  = useState(true);
  const [phA,      setPhA]   = useState(false);
  const [phB,      setPhB]   = useState(false);

  useEffect(() => { rateRef.current  = usr.rate  || 2; }, [usr.rate]);
  useEffect(() => { depthRef.current = usr.depth || 4; }, [usr.depth]);

  const setWf = v => { wfRef.current = v; setWfSt(v); };
  const setMr = v => { const nv = typeof v === 'function' ? v(modRunRef.current) : v; modRunRef.current = nv; setMrSt(nv); };
  const sp = (k, v) => setUsr(u => ({ ...u, [k]: v }));
  const p  = k => usr[k] || 0;
  const R  = { display: 'flex', alignItems: 'center', gap: 5 };

  useEffect(() => {
    const ss = (ref, w, h) => { if (ref.current) { ref.current.width = w; ref.current.height = h; } };
    ss(oscRef, 200, 52); ss(modRef, 176, 22); ss(sterRef, 88, 36); ss(vuLRef, 13, 88); ss(vuRRef, 13, 88);
    let t = 0;
    const draw = () => {
      t += 1 / 60;
      const rate = rateRef.current, depth = depthRef.current;

      const oc = oscRef.current && oscRef.current.getContext('2d');
      if (oc) {
        const W = 200, H = 52;
        oc.fillStyle = '#001a00'; oc.fillRect(0, 0, W, H);
        oc.strokeStyle = MF.green; oc.lineWidth = 1.8; oc.shadowColor = MF.green; oc.shadowBlur = 3;
        oc.beginPath();
        const amp = Math.max(3, (depth / 12) * (H / 2 - 7));
        const wf = wfRef.current;
        for (let x = 0; x < W; x++) {
          const ph = (x / W) * Math.PI * 4 + t * rate * 1.5;
          let y = wf === 'Sine' ? Math.sin(ph) : wf === 'Triangle' ? (2 / Math.PI) * Math.asin(Math.sin(ph)) : wf === 'Sawtooth' ? ((ph % (Math.PI * 2)) / (Math.PI * 2)) * 2 - 1 : Math.sign(Math.sin(ph));
          const py = H / 2 - y * amp;
          x === 0 ? oc.moveTo(x, py) : oc.lineTo(x, py);
        }
        oc.stroke(); oc.shadowBlur = 0;
        oc.strokeStyle = 'rgba(0,200,50,.28)'; oc.lineWidth = 1; oc.setLineDash([4, 7]);
        oc.beginPath(); oc.moveTo(0, H / 2); oc.lineTo(W, H / 2); oc.stroke(); oc.setLineDash([]);
      }

      const mc = modRef.current && modRef.current.getContext('2d');
      if (mc) {
        const W = 176, H = 22;
        mc.fillStyle = '#001200'; mc.fillRect(0, 0, W, H);
        mc.fillStyle = '#003300'; mc.fillRect(3, H / 2 - 3, W - 6, 6);
        if (modRunRef.current) {
          const pos = 0.5 + Math.sin(t * rate * Math.PI * 2) * 0.44 * (depth / 12);
          const x = 4 + Math.max(0, Math.min(1, pos)) * (W - 10);
          mc.fillStyle = '#005500'; mc.fillRect(Math.min(x, W / 2), H / 2 - 3, Math.abs(x - W / 2), 6);
          mc.shadowColor = MF.green; mc.shadowBlur = 4;
          mc.fillStyle = MF.green; mc.fillRect(x - 3, 2, 7, H - 4); mc.shadowBlur = 0;
        }
      }

      const sc = sterRef.current && sterRef.current.getContext('2d');
      if (sc) {
        const W = 88, H = 36, cols = 14, rows = 5;
        sc.fillStyle = '#001200'; sc.fillRect(0, 0, W, H);
        const cw = W / cols, rh = H / rows;
        const pos = 0.5 + Math.sin(t * rate * Math.PI * 1.4) * 0.38 * (depth / 12);
        for (let r = 0; r < rows; r++) {
          for (let col = 0; col < cols; col++) {
            const norm = col / (cols - 1);
            const bright = 1 - Math.abs(norm - pos) * 6 * (12 / Math.max(0.5, depth));
            sc.fillStyle = bright > 0.65 ? MF.green : bright > 0.2 ? '#007722' : '#002200';
            sc.fillRect(col * cw + 1, r * rh + 1, cw - 2, rh - 2);
          }
        }
      }

      [vuLRef, vuRRef].forEach((ref, side) => {
        const vc = ref.current && ref.current.getContext('2d');
        if (vc) {
          const W = 13, H = 88, segs = 18;
          vc.fillStyle = '#080808'; vc.fillRect(0, 0, W, H);
          const lv = Math.max(0, Math.min(1, 0.5 + Math.sin(t * rate * 2.1 + side * 1.3) * 0.22 * (depth / 12) * 0.9));
          for (let i = 0; i < segs; i++) {
            const pct = 1 - i / segs, on = pct < lv;
            const col = i < 2 ? '#dd2222' : i < 4 ? '#ddaa00' : MF.green;
            vc.fillStyle = on ? col : '#181818';
            vc.fillRect(1, (i / segs) * H + 1, W - 2, (H / segs) - 2);
          }
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div style={{ background: MF.bg, borderRadius: 5, border: '2px solid #484848', padding: '8px 6px', boxShadow: '3px 4px 12px rgba(0,0,0,.8)', display: 'inline-flex', gap: 0, direction: 'ltr', userSelect: 'none', alignItems: 'stretch', flexWrap: 'wrap', maxWidth: '100%' }}>
      {/* Mix / Feedback / Filter */}
      <MFSec style={{ minWidth: 132 }}>
        <div>
          <div style={{ ...R, justifyContent: 'space-between' }}><MFLbl>Mix</MFLbl><MFLbl>∅</MFLbl></div>
          <div style={{ ...R, marginTop: 3 }}><MFDragNum val={p('mix')} min={0} max={100} onChange={v => sp('mix', v)} /><MFLED on={phA} onClick={() => setPhA(x => !x)} /></div>
        </div>
        <div>
          <div style={{ ...R, justifyContent: 'space-between' }}><MFLbl>Feedback</MFLbl><MFLbl>∅</MFLbl></div>
          <div style={{ ...R, marginTop: 3 }}><MFDragNum val={p('fb')} min={0} max={100} onChange={v => sp('fb', v)} /><MFLED on={phB} onClick={() => setPhB(x => !x)} /></div>
        </div>
        <div>
          <MFLbl>Type/Freq &nbsp;&nbsp;&nbsp; on/off</MFLbl>
          <div style={{ ...R, marginTop: 3 }}>
            <MFBtn style={{ width: 26, fontSize: 13, padding: '2px 0', textAlign: 'center' }}>╲</MFBtn>
            <MFDisp val="14k" w={40} />
            <MFLED on={freqOn} onClick={() => setFreqOn(x => !x)} />
          </div>
        </div>
      </MFSec>

      <div style={{ width: 2, background: 'linear-gradient(180deg,#707070,#c0c0c0,#707070)', margin: '0 1px' }} />

      {/* Delay / Rate / Depth */}
      <MFSec style={{ minWidth: 118 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 5, alignItems: 'end' }}>
          <div><MFLbl>Delay</MFLbl><div style={{ marginTop: 3 }}><MFDragNum val={p('time')} min={0.1} max={20} onChange={v => sp('time', v)} /></div></div>
          <div style={{ paddingBottom: 1 }}><MFLbl>Tape</MFLbl><MFLED on={tape} onClick={() => setTape(x => !x)} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 5, alignItems: 'end' }}>
          <div>
            <MFLbl>Rate(Hz)</MFLbl>
            <div style={{ ...R, marginTop: 3 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <button onClick={() => sp('rate', +Math.min(15, p('rate') + 0.1).toFixed(2))} style={{ background: MF.btnU, border: MF.bdr, borderRadius: 2, width: 16, height: 12, cursor: 'pointer', padding: 0, fontSize: 7, fontWeight: 700, color: MF.text, lineHeight: 1 }}>▲</button>
                <button onClick={() => sp('rate', +Math.max(0.1, p('rate') - 0.1).toFixed(2))} style={{ background: MF.btnU, border: MF.bdr, borderRadius: 2, width: 16, height: 12, cursor: 'pointer', padding: 0, fontSize: 7, fontWeight: 700, color: MF.text, lineHeight: 1 }}>▼</button>
              </div>
              <MFDragNum val={p('rate')} min={0.1} max={15} onChange={v => sp('rate', v)} />
            </div>
          </div>
          <div style={{ paddingBottom: 1 }}><MFLbl>Sync</MFLbl><MFBtn active={syncM} onClick={() => setSyncM(x => !x)} style={{ width: 22, padding: '3px 0', textAlign: 'center' }}>M</MFBtn></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 5, alignItems: 'end' }}>
          <div><MFLbl>Depth</MFLbl><div style={{ marginTop: 3 }}><MFDragNum val={p('depth')} min={0} max={12} onChange={v => sp('depth', v)} /></div></div>
          <div style={{ paddingBottom: 1 }}><MFLbl>Link</MFLbl><MFLED on={link} onClick={() => setLink(x => !x)} /></div>
        </div>
      </MFSec>

      <div style={{ width: 2, background: 'linear-gradient(180deg,#707070,#c0c0c0,#707070)', margin: '0 1px' }} />

      {/* Waveform / Modulation / Stereo */}
      <MFSec style={{ minWidth: 258 }}>
        <div>
          <MFLbl>Waveform</MFLbl>
          <div style={{ ...R, marginTop: 3 }}>
            <MFBtn onClick={() => setWf(WAVEFORMS[(WAVEFORMS.indexOf(wfRef.current) + 1) % WAVEFORMS.length])} style={{ minWidth: 62 }}>{waveform}</MFBtn>
            <div style={{ background: '#001500', border: '2px solid #363636', borderRadius: 2, overflow: 'hidden', lineHeight: 0, boxShadow: 'inset 0 2px 6px rgba(0,0,0,.9)' }}><canvas ref={oscRef} /></div>
          </div>
        </div>
        <div>
          <MFLbl>Modulation</MFLbl>
          <div style={{ ...R, marginTop: 3 }}>
            <div style={{ background: '#001200', border: '2px solid #363636', borderRadius: 2, overflow: 'hidden', lineHeight: 0, boxShadow: 'inset 0 2px 6px rgba(0,0,0,.9)' }}><canvas ref={modRef} /></div>
            <MFBtn active={!modRun} onClick={() => setMr(x => !x)} style={{ minWidth: 38 }}>{modRun ? 'Stop' : 'Run'}</MFBtn>
          </div>
        </div>
        <div>
          <MFLbl>Stereo</MFLbl>
          <div style={{ ...R, marginTop: 3 }}>
            <MFDragNum val={p('stereo') || 50} min={0} max={100} onChange={v => sp('stereo', v)} w={42} />
            <div style={{ background: '#001200', border: '2px solid #363636', borderRadius: 2, overflow: 'hidden', lineHeight: 0, boxShadow: 'inset 0 2px 6px rgba(0,0,0,.9)' }}><canvas ref={sterRef} /></div>
          </div>
        </div>
      </MFSec>

      <div style={{ width: 2, background: 'linear-gradient(180deg,#707070,#c0c0c0,#707070)', margin: '0 1px' }} />

      {/* Gain fader + VU */}
      <MFSec style={{ flexDirection: 'row', gap: 10, padding: '9px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <MFLbl>Gain</MFLbl>
          <div style={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 84, paddingTop: 2 }}>
              {['—12', '— 0', '—-12'].map(v => <div key={v} style={{ fontSize: 8, color: MF.text, whiteSpace: 'nowrap', fontFamily: 'Arial' }}>{v}</div>)}
            </div>
            <div style={{ position: 'relative', width: 22, height: 88 }}>
              <div style={{ position: 'absolute', left: '50%', top: 2, bottom: 2, width: 5, background: 'linear-gradient(90deg,#848484,#c8c8c8,#848484)', borderRadius: 2, transform: 'translateX(-50%)' }} />
              <div style={{ position: 'absolute', left: '50%', top: Math.max(0, Math.min(68, (1 - (p('gain') + 1) / 1.5) * 68)), width: 22, height: 18, background: 'linear-gradient(180deg,#cccccc,#888)', border: '1px solid #444', borderRadius: 3, transform: 'translateX(-50%)', cursor: 'ns-resize', boxShadow: '1px 1px 0 rgba(255,255,255,.4) inset' }}
                onMouseDown={e => { e.preventDefault(); const sy = e.clientY, sv = p('gain'); const mv = m => sp('gain', Math.max(-1, Math.min(0.5, sv + (sy - m.clientY) / 80))); const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); }; window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up); }}
              />
            </div>
          </div>
          <MFDisp val={((p('gain') || 0) * 10).toFixed(1)} w={42} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <MFLbl>Output</MFLbl>
          <div style={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 84, paddingTop: 2 }}>
              {['—12', '— 0', '—-12'].map(v => <div key={v} style={{ fontSize: 8, color: MF.text, whiteSpace: 'nowrap', fontFamily: 'Arial' }}>{v}</div>)}
            </div>
            <div style={{ background: '#080808', border: '2px solid #363636', borderRadius: 2, padding: '2px', display: 'flex', gap: 2, lineHeight: 0 }}>
              <canvas ref={vuLRef} /><canvas ref={vuRRef} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 3 }}><MFDisp val="-9.5" w={32} /><MFDisp val="-12" w={32} /></div>
        </div>
      </MFSec>

      {/* Controls row */}
      <div style={{ width: '100%', display: 'flex', gap: 8, padding: '10px 0 0', direction: 'rtl', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={onNewRound} style={{ padding: '9px 22px', background: C.y, color: '#000', border: 'none', borderRadius: 7, fontWeight: 900, cursor: 'pointer', fontSize: 13 }}>🎲 תרגיל חדש</button>
        {tgt && <>
          <button onClick={onPlayTarget} style={{ padding: '9px 18px', background: 'transparent', color: C.y,    border: '2px solid ' + C.y,    borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>🔊 טרגט</button>
          <button onClick={onPlayUser}   style={{ padding: '9px 18px', background: 'transparent', color: C.blue, border: '2px solid ' + C.blue, borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>🔊 שלי</button>
          <button onClick={onSubmit} disabled={phase === 'done'} style={{ padding: '9px 18px', background: phase === 'done' ? C.yDim : C.green, color: '#000', border: 'none', borderRadius: 7, fontWeight: 900, cursor: 'pointer', fontSize: 13 }}>✓ בדוק</button>
        </>}
        <button onClick={onStop} style={{ padding: '9px 14px', background: 'transparent', color: C.red, border: '2px solid ' + C.red, borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>■</button>
        {tgt && <div style={{ fontSize: 11, color: C.muted, marginRight: 'auto' }}>גרור נומרים לכיוון · שמע טרגט → כוון → בדוק</div>}
      </div>

      {res != null && (
        <div style={{ width: '100%', marginTop: 10, padding: 16, background: res > 70 ? 'rgba(0,232,122,.08)' : 'rgba(255,215,0,.08)', border: '1px solid ' + (res > 70 ? C.green : C.y), borderRadius: 8, textAlign: 'center', direction: 'rtl' }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: res > 70 ? C.green : C.y }}>{res + '/100'}</div>
          <div style={{ color: C.muted, marginTop: 3, fontSize: 13 }}>{res > 70 ? '🎯 מדויק! כיוון מושלם' : '💪 תמשיך להתאמן!'}</div>
        </div>
      )}
    </div>
  );
}
