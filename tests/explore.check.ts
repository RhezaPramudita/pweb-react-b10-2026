// Self-check logika bagian A. Jalankan: node tests/explore.check.ts
import assert from 'node:assert/strict';
import type { Application } from '../src/types/index.ts';
import { getSkillMatch } from '../src/utils/skillMatch.ts';
import { getOfferScore, rankOffers } from '../src/utils/offerScore.ts';

const base = (over: Partial<Application>): Application => ({
  id: crypto.randomUUID(),
  company: 'Garuda FinTech',
  role: 'Frontend Intern',
  workMode: 'Remote',
  status: 'OFFER',
  requiredSkills: [],
  lastUpdatedAt: new Date().toISOString(),
  checklist: [],
  activityLogs: [],
  ...over,
});

// Skill match: case-insensitive, pembulatan Math.round, daftar missing
const m = getSkillMatch(['react', 'TYPESCRIPT'], ['React', 'TypeScript', 'Docker']);
assert.equal(m.score, 67); // 2/3 = 66.67 -> 67
assert.deepEqual(m.missing, ['Docker']);

// Offer score: gaji tertinggi + match penuh + remote = 100
assert.equal(getOfferScore(10_000_000, 10_000_000, 100, 'Remote'), 100);
// 50% gaji, 0 match, onsite -> 25 + 0 + 10 = 35
assert.equal(getOfferScore(5_000_000, 10_000_000, 0, 'Onsite'), 35);

const skills = ['React', 'TypeScript', 'CSS'];
const a = base({ company: 'A', salaryOffer: 8_000_000, workMode: 'Onsite', requiredSkills: ['Go'] });
const b = base({ company: 'B', salaryOffer: 7_000_000, workMode: 'Remote', requiredSkills: skills });
const notOffer = base({ company: 'C', status: 'INTERVIEW', salaryOffer: 20_000_000 });
const ranked = rankOffers([a, b, notOffer], skills);

assert.equal(ranked.length, 2); // non-OFFER diabaikan
assert.equal(ranked[0].app.company, 'B'); // gaji lebih kecil tapi match & remote unggul
assert.equal(ranked[1].salaryScore, 100);
assert.equal(rankOffers([], skills).length, 0);

console.log('explore OK');
