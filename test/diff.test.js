'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { diffMasters, summarize } = require('../lib/diff');

function loadData() {
  const prev = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'previous.json'), 'utf8'));
  const cur = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'current.json'), 'utf8'));
  return { prev, cur };
}

test('前月と今月の名簿を比べ新規2件・変更3件・削除2件・継続5件に分ける', () => {
  const { prev, cur } = loadData();
  const diff = diffMasters(prev, cur);
  const s = summarize(diff);
  assert.equal(s.added, 2);
  assert.equal(s.changed, 3);
  assert.equal(s.removed, 2);
  assert.equal(s.unchanged, 5);
});

test('住所が変わった施設を住所変更として一覧に含める', () => {
  const { prev, cur } = loadData();
  const diff = diffMasters(prev, cur);
  const row = diff.changed.find((r) => r.id === 'F-1002');
  assert.ok(row);
  assert.ok(row.changedFields.includes('address'));
  assert.equal(row.previous.address, '東区森本2-4-1');
  assert.equal(row.current.address, '東区森本2-4-8');
});

test('病床数が変わった施設を病床数変更として一覧に含める', () => {
  const { prev, cur } = loadData();
  const diff = diffMasters(prev, cur);
  const row = diff.changed.find((r) => r.id === 'F-1003');
  assert.ok(row);
  assert.ok(row.changedFields.includes('beds'));
});

test('今月だけにある施設を新規として返す', () => {
  const { prev, cur } = loadData();
  const diff = diffMasters(prev, cur);
  const ids = diff.added.map((r) => r.id).sort();
  assert.deepEqual(ids, ['F-1011', 'F-1012']);
});

test('前月だけにある施設を削除として返す', () => {
  const { prev, cur } = loadData();
  const diff = diffMasters(prev, cur);
  const ids = diff.removed.map((r) => r.id).sort();
  assert.deepEqual(ids, ['F-1009', 'F-1010']);
});

test('両月で内容が同じ施設を継続として返す', () => {
  const { prev, cur } = loadData();
  const diff = diffMasters(prev, cur);
  const ids = diff.unchanged.map((r) => r.id).sort();
  assert.deepEqual(ids, ['F-1001', 'F-1004', 'F-1005', 'F-1007', 'F-1008']);
});

test('前後の空白だけの差は変更として数えない', () => {
  const diff = diffMasters(
    [{ id: 'F-1001', name: 'あおぞら診療所', address: '北区花見1-2-3', tel: '011-111-1001', beds: '0' }],
    [{ id: 'F-1001', name: ' あおぞら診療所 ', address: '北区花見1-2-3', tel: '011-111-1001', beds: '0' }]
  );
  assert.equal(diff.changed.length, 0);
  assert.equal(diff.unchanged.length, 1);
});
