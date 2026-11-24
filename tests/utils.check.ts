// Self-check logika utils. Jalankan: node tests/utils.check.ts
import assert from 'node:assert/strict';
import type { Application } from '../src/types/index.ts';
import {
  findInterviewConflicts,
  isDuplicate,
  isRawanGhosting,
  shiftDays,
} from '../src/utils/application.ts';
import { getSkillMatch } from '../src/utils/skillMatch.ts';

const base = (over: Partial<Application>): Application => ({
  id: crypto.randomUUID(),
  company: 'Garuda FinTech',
  role: 'Frontend Intern',
  workMode: 'Remote',
  status: 'WISHLIST',
  requiredSkills: [],
  lastUpdatedAt: new Date().toISOString(),
  checklist: [],
  activityLogs: [],
  ...over,
});

// Contoh di soal: 3 dari 4 cocok -> 75%, Docker missing
const m = getSkillMatch(['React', 'TypeScript', 'CSS'], ['react', 'TypeScript', 'CSS', 'Docker']);
assert.equal(m.score, 75);
assert.deepEqual(m.missing, ['Docker']);
assert.equal(getSkillMatch(['React'], []).score, 0);

// Duplikat case-insensitive + spasi
assert.ok(isDuplicate([base({})], '  garuda fintech ', 'FRONTEND INTERN'));
assert.ok(!isDuplicate([base({})], 'Garuda FinTech', 'Backend Intern'));

// Ghosting: >14 hari & hanya APPLIED/SCREENING
const now = new Date().toISOString();
assert.ok(!isRawanGhosting(base({ status: 'APPLIED', lastUpdatedAt: now })));
assert.ok(isRawanGhosting(base({ status: 'APPLIED', lastUpdatedAt: shiftDays(now, 15) })));
assert.ok(isRawanGhosting(base({ status: 'SCREENING', lastUpdatedAt: shiftDays(now, 15) })));
assert.ok(!isRawanGhosting(base({ status: 'INTERVIEW', lastUpdatedAt: shiftDays(now, 15) })));
assert.ok(!isRawanGhosting(base({ status: 'APPLIED', lastUpdatedAt: shiftDays(now, 14) })));

// Bentrok: selisih 30 menit bentrok, 60 menit tidak, non-INTERVIEW diabaikan
const a = base({ status: 'INTERVIEW', interviewDateTime: '2026-11-22T10:00' });
const b = base({ status: 'INTERVIEW', interviewDateTime: '2026-11-22T10:30' });
const c = base({ status: 'INTERVIEW', interviewDateTime: '2026-11-22T11:30' });
const d = base({ status: 'APPLIED', interviewDateTime: '2026-11-22T10:10' });
assert.deepEqual(findInterviewConflicts([a, b, c, d]), [[a, b]]);
assert.equal(findInterviewConflicts([a, c]).length, 0);

console.log('utils OK');
