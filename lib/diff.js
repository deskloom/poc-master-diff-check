'use strict';

// 前月マスタと今月マスタを施設コードで突き合わせ、
// 新規・変更・削除・継続に分類する。比較対象フィールドは name/address/tel/beds。

const FIELDS = ['name', 'address', 'tel', 'beds'];

function normalizeRecord(rec) {
  const out = { id: String(rec.id).trim() };
  for (const f of FIELDS) {
    const v = rec[f];
    out[f] = v === null || v === undefined ? '' : String(v).trim();
  }
  return out;
}

function changedFields(oldRec, newRec) {
  const diffs = [];
  for (const f of FIELDS) {
    if (oldRec[f] !== newRec[f]) diffs.push(f);
  }
  return diffs;
}

function diffMasters(previous, current) {
  const prevMap = new Map();
  for (const r of previous) {
    const n = normalizeRecord(r);
    prevMap.set(n.id, n);
  }
  const curMap = new Map();
  for (const r of current) {
    const n = normalizeRecord(r);
    curMap.set(n.id, n);
  }

  const added = [];
  const removed = [];
  const changed = [];
  const unchanged = [];

  for (const [id, cur] of curMap) {
    const prev = prevMap.get(id);
    if (!prev) {
      added.push({ id, current: cur, previous: null, status: 'added', changedFields: [] });
    } else {
      const df = changedFields(prev, cur);
      if (df.length === 0) {
        unchanged.push({ id, current: cur, previous: prev, status: 'unchanged', changedFields: [] });
      } else {
        changed.push({ id, current: cur, previous: prev, status: 'changed', changedFields: df });
      }
    }
  }
  for (const [id, prev] of prevMap) {
    if (!curMap.has(id)) {
      removed.push({ id, current: null, previous: prev, status: 'removed', changedFields: [] });
    }
  }

  const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  added.sort(byId);
  removed.sort(byId);
  changed.sort(byId);
  unchanged.sort(byId);

  return { added, removed, changed, unchanged };
}

function summarize(diff) {
  return {
    added: diff.added.length,
    changed: diff.changed.length,
    removed: diff.removed.length,
    unchanged: diff.unchanged.length,
    total: diff.added.length + diff.changed.length + diff.removed.length + diff.unchanged.length
  };
}

module.exports = { diffMasters, summarize, FIELDS };
