import { useState, useEffect, useRef } from 'react';
import { buildOscBuffer } from '../components/SignalSourcePicker.jsx';

// ── encode / decode ────────────────────────────────────────────

const PREFIX_RE = /^\[\[signal:(.*?)\]\]/s;

export function parseSignalFromNotes(notes) {
  const m = (notes || '').match(PREFIX_RE);
  if (!m) return { signalType: 'auto', signalConfig: null, pureNotes: notes || '' };
  try {
    const cfg = JSON.parse(m[1]);
    return { signalType: cfg.type || 'auto', signalConfig: cfg, pureNotes: (notes || '').slice(m[0].length) };
  } catch {
    return { signalType: 'auto', signalConfig: null, pureNotes: notes || '' };
  }
}

export function serializeSignalToNotes(signalType, signalConfig, pureNotes) {
  if (!signalType || signalType === 'auto') return pureNotes || '';
  return `[[signal:${JSON.stringify({ type: signalType, ...signalConfig })}]]${pureNotes || ''}`;
}

// ── hook ───────────────────────────────────────────────────────

// Returns { sigBufRef (React ref), loading }
// sigBufRef.current === null  → use built-in auto signal
// sigBufRef.current is Float32Array → use custom signal
export function useSignalSource(exercise, sampleRate = 44100) {
  const [loading, setLoading] = useState(true);
  const sigBufRef = useRef(null);

  useEffect(() => {
    const { signalType, signalConfig } = parseSignalFromNotes(exercise?.notes);

    if (signalType === 'auto' || !signalConfig) {
      sigBufRef.current = null;
      setLoading(false);
      return;
    }

    if (signalType === 'osc') {
      setLoading(true);
      buildOscBuffer(sampleRate, signalConfig.wave || 'sine', signalConfig.freq || 440, 4)
        .then(buf => { sigBufRef.current = buf; setLoading(false); });
      return;
    }

    if (signalType === 'file' && signalConfig.url) {
      setLoading(true);
      fetch(signalConfig.url)
        .then(r => r.arrayBuffer())
        .then(ab => {
          const tmp = new OfflineAudioContext(1, 1, sampleRate);
          return tmp.decodeAudioData(ab);
        })
        .then(decoded => {
          const maxLen = Math.floor(sampleRate * 4);
          const len = Math.min(decoded.length, maxLen);
          const out = new Float32Array(len);
          for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
            const d = decoded.getChannelData(ch);
            for (let i = 0; i < len; i++) out[i] += d[i] / decoded.numberOfChannels;
          }
          sigBufRef.current = out;
          setLoading(false);
        })
        .catch(() => { sigBufRef.current = null; setLoading(false); });
      return;
    }

    sigBufRef.current = null;
    setLoading(false);
  }, [exercise?.notes, sampleRate]);

  return { sigBufRef, loading };
}
