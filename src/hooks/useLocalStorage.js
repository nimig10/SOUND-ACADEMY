import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage full or unavailable
    }
  }, [key, value]);

  return [value, setValue];
}

// Strip blob URLs before persisting — they expire on page reload
export function stripAudioUrls(list) {
  return list.map(item => ({ ...item, audioUrl: null }));
}
