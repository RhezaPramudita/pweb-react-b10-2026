import type { Application, WorkMode } from '../types/index.ts';
import { getSkillMatch } from './skillMatch.ts';

// Bobot penilaian offer (total 100%).
export const OFFER_WEIGHTS = { salary: 0.5, match: 0.3, workMode: 0.2 } as const;

export const WORK_MODE_SCORE: Record<WorkMode, number> = {
  Remote: 100,
  Hybrid: 75,
  Onsite: 50,
};

export interface OfferScore {
  app: Application;
  salaryScore: number; // 0-100, relatif terhadap gaji tertinggi
  matchScore: number; // 0-100, Skill Match %
  workModeScore: number; // 0-100
  total: number; // 0-100
}

// Skor 1 offer. Gaji dinormalisasi terhadap gaji tertinggi di antara offer yang dibandingkan.
export function getOfferScore(
  salary: number,
  maxSalary: number,
  matchScore: number,
  workMode: WorkMode,
): number {
  const salaryScore = maxSalary > 0 ? (salary / maxSalary) * 100 : 0;
  return Math.round(
    salaryScore * OFFER_WEIGHTS.salary +
      matchScore * OFFER_WEIGHTS.match +
      WORK_MODE_SCORE[workMode] * OFFER_WEIGHTS.workMode,
  );
}

// Semua lamaran OFFER (salaryOffer > 0) diurutkan dari skor tertinggi.
export function rankOffers(apps: Application[], kaptenSkills: string[]): OfferScore[] {
  const offers = apps.filter((a) => a.status === 'OFFER' && (a.salaryOffer ?? 0) > 0);
  const maxSalary = Math.max(0, ...offers.map((a) => a.salaryOffer!));

  return offers
    .map((app) => {
      const salary = app.salaryOffer!;
      const matchScore = getSkillMatch(kaptenSkills, app.requiredSkills).score;
      return {
        app,
        salaryScore: maxSalary > 0 ? Math.round((salary / maxSalary) * 100) : 0,
        matchScore,
        workModeScore: WORK_MODE_SCORE[app.workMode],
        total: getOfferScore(salary, maxSalary, matchScore, app.workMode),
      };
    })
    .toSorted((a, b) => b.total - a.total);
}
