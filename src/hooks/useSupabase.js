import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

// Generic hook — loads a full table and syncs writes back
export function useTable(table, initialData) {
  const [data, setData]     = useState(initialData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from(table).select('*').then(({ data: rows, error }) => {
      if (!error && rows && rows.length > 0) setData(deserialize(table, rows));
      setLoaded(true);
    });
  }, [table]);

  const setDataAndSync = updater => {
    setData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      syncTable(table, next);
      return next;
    });
  };

  return [data, setDataAndSync, loaded];
}

// scores (doneMap) is a special case — keyed object, not an array
export function useScores(studentId) {
  const [scores, setScores] = useState({});

  useEffect(() => {
    if (!studentId) return;
    supabase.from('scores').select('exercise_id, score').eq('student_id', studentId)
      .then(({ data: rows, error }) => {
        if (!error && rows) {
          const map = {};
          rows.forEach(r => { map[r.exercise_id] = r.score; });
          setScores(map);
        }
      });
  }, [studentId]);

  const saveScore = async (exerciseId, score) => {
    setScores(prev => ({ ...prev, [exerciseId]: score }));
    await supabase.from('scores').upsert({ student_id: studentId, exercise_id: exerciseId, score });
  };

  return [scores, saveScore];
}

// ── helpers ──

function syncTable(table, data) {
  if (table === 'mixer_channels') {
    // only sync names, no audio blobs
    supabase.from(table).upsert(data.map(ch => ({ id: ch.id, name: ch.name }))).then();
    return;
  }
  if (table === 'exercises') {
    supabase.from(table).upsert(data.map(ex => ({
      id: ex.id, type: ex.type, title: ex.title, diff: ex.diff,
      description: ex.description || '', instructions: ex.instructions || '',
      audio_name: ex.audioName || null, notes: ex.notes || '',
    }))).then();
    // delete removed rows
    if (data.length > 0) {
      supabase.from(table).delete().not('id', 'in', `(${data.map(r => r.id).join(',')})`).then();
    }
    return;
  }
  if (table === 'students') {
    supabase.from(table).upsert(data.map(s => ({
      id: s.id, name: s.name, assigned_ids: s.assignedIds,
    }))).then();
    if (data.length > 0) {
      supabase.from(table).delete().not('id', 'in', `(${data.map(r => r.id).join(',')})`).then();
    }
    return;
  }
  if (table === 'ex_types') {
    supabase.from(table).upsert(data.map(t => ({
      id: t.id, label: t.label, icon: t.icon, color: t.color,
    }))).then();
    if (data.length > 0) {
      supabase.from(table).delete().not('id', 'in', `(${data.map(r => `'${r.id}'`).join(',')})`).then();
    }
    return;
  }
}

function deserialize(table, rows) {
  if (table === 'students') {
    return rows.map(r => ({ id: r.id, name: r.name, assignedIds: r.assigned_ids || [] }));
  }
  if (table === 'exercises') {
    return rows.map(r => ({ id: r.id, type: r.type, title: r.title, diff: r.diff, description: r.description, instructions: r.instructions, audioUrl: null, audioName: r.audio_name, notes: r.notes }));
  }
  if (table === 'ex_types') {
    return rows.map(r => ({ id: r.id, label: r.label, icon: r.icon, color: r.color }));
  }
  if (table === 'mixer_channels') {
    return rows.map(r => ({ id: r.id, name: r.name, audioUrl: null, audioName: null }));
  }
  return rows;
}
