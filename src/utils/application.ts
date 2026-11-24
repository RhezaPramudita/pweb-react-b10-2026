import type { ActivityLog, Application } from '../types/index.ts';

const DAY_MS = 24 * 60 * 60 * 1000;
export const GHOSTING_DAYS = 14;
export const CONFLICT_MINUTES = 60;

const normalize = (s: string) => s.trim().toLowerCase();

// Anti-duplikat: company + role sama (case-insensitive) dianggap lamaran yang sama.
export function isDuplicate(apps: Application[], company: string, role: string): boolean {
  return apps.some(
    (a) => normalize(a.company) === normalize(company) && normalize(a.role) === normalize(role),
  );
}

// APPLIED/SCREENING yang tidak berubah > 14 hari.
export function isRawanGhosting(app: Application, now: number = Date.now()): boolean {
  if (app.status !== 'APPLIED' && app.status !== 'SCREENING') return false;
  return now - Date.parse(app.lastUpdatedAt) > GHOSTING_DAYS * DAY_MS;
}

// Semua pasangan lamaran INTERVIEW yang jadwalnya berselisih < 60 menit.
export function findInterviewConflicts(apps: Application[]): [Application, Application][] {
  const interviews = apps.filter((a) => a.status === 'INTERVIEW' && a.interviewDateTime);
  const conflicts: [Application, Application][] = [];
  for (let i = 0; i < interviews.length; i++) {
    for (let j = i + 1; j < interviews.length; j++) {
      const diff = Math.abs(
        Date.parse(interviews[i].interviewDateTime!) - Date.parse(interviews[j].interviewDateTime!),
      );
      if (diff < CONFLICT_MINUTES * 60 * 1000) conflicts.push([interviews[i], interviews[j]]);
    }
  }
  return conflicts;
}

// Mundurkan lastUpdatedAt agar badge Rawan Ghosting bisa didemokan.
export function shiftDays(iso: string, days: number): string {
  return new Date(Date.parse(iso) - days * DAY_MS).toISOString();
}

export function createLog(message: string): ActivityLog {
  return { id: crypto.randomUUID(), timestamp: new Date().toISOString(), message };
}

// Dipakai Form Manual (B) dan tombol "Simpan ke Wishlist" (A).
export function createApplication(
  data: Omit<Application, 'id' | 'lastUpdatedAt' | 'checklist' | 'activityLogs'>,
  logMessage: string,
): Application {
  return {
    ...data,
    id: crypto.randomUUID(),
    lastUpdatedAt: new Date().toISOString(),
    checklist: [],
    activityLogs: [createLog(logMessage)],
  };
}
