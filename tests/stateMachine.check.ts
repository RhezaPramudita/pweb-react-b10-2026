// Self-check state machine. Jalankan: node tests/stateMachine.check.ts
import assert from 'node:assert/strict';
import type { Application } from '../src/types/index.ts';
import { applyTransition, canTransition, validateTransition } from '../src/utils/stateMachine.ts';

const app: Application = {
  id: '1',
  company: 'Garuda FinTech',
  role: 'Frontend Intern',
  workMode: 'Remote',
  status: 'WISHLIST',
  requiredSkills: [],
  lastUpdatedAt: '2026-01-01T00:00:00.000Z',
  checklist: [],
  activityLogs: [],
};

// Testcase 5: WISHLIST tidak bisa langsung ke OFFER; OFFER & REJECTED final; GHOSTED -> SCREENING
assert.ok(!canTransition('WISHLIST', 'OFFER'));
assert.ok(canTransition('WISHLIST', 'APPLIED'));
assert.ok(canTransition('GHOSTED', 'SCREENING'));
assert.ok(!canTransition('OFFER', 'REJECTED'));
assert.ok(!canTransition('REJECTED', 'SCREENING'));

// Syarat pindah status
assert.ok(validateTransition('WISHLIST', 'APPLIED', {}));
assert.ok(validateTransition('WISHLIST', 'APPLIED', { cvVersion: '  ', appliedDate: '2026-11-01' }));
assert.equal(validateTransition('WISHLIST', 'APPLIED', { cvVersion: 'v2', appliedDate: '2026-11-01' }), null);
assert.ok(validateTransition('SCREENING', 'INTERVIEW', {}));
assert.ok(validateTransition('INTERVIEW', 'OFFER', { salaryOffer: 0, workMode: 'Remote' }));
assert.ok(validateTransition('INTERVIEW', 'OFFER', { salaryOffer: Number('abc'), workMode: 'Remote' }));
assert.equal(validateTransition('INTERVIEW', 'OFFER', { salaryOffer: 5_000_000, workMode: 'Hybrid' }), null);
assert.equal(validateTransition('APPLIED', 'REJECTED', {}), null);

// applyTransition immutable + log otomatis
const next = applyTransition(app, 'APPLIED', { cvVersion: ' v2.pdf ', appliedDate: '2026-11-01' });
assert.equal(app.status, 'WISHLIST'); // objek lama tidak berubah
assert.equal(app.activityLogs.length, 0);
assert.equal(next.status, 'APPLIED');
assert.equal(next.cvVersion, 'v2.pdf');
assert.equal(next.activityLogs.length, 1);
assert.notEqual(next.lastUpdatedAt, app.lastUpdatedAt);

const offer = applyTransition({ ...next, status: 'INTERVIEW' }, 'OFFER', { salaryOffer: 5_000_000, workMode: 'Hybrid' });
assert.equal(offer.salaryOffer, 5_000_000);
assert.equal(offer.workMode, 'Hybrid');

console.log('stateMachine OK');
