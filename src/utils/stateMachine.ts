import type { Application, ApplicationStatus, WorkMode } from '../types/index.ts';
import { createLog } from './application.ts';
import { formatDateTime, formatRupiah } from './format.ts';

// Diagram State Machine: status hanya boleh pindah mengikuti panah ini.
// OFFER & REJECTED final (tidak punya tujuan). GHOSTED khusus boleh kembali ke SCREENING.
export const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  WISHLIST: ['APPLIED'],
  APPLIED: ['SCREENING', 'REJECTED', 'GHOSTED'],
  SCREENING: ['INTERVIEW', 'REJECTED', 'GHOSTED'],
  INTERVIEW: ['OFFER', 'REJECTED', 'GHOSTED'],
  OFFER: [],
  REJECTED: [],
  GHOSTED: ['SCREENING'],
};

export const getNextStatuses = (from: ApplicationStatus) => TRANSITIONS[from];

export const canTransition = (from: ApplicationStatus, to: ApplicationStatus) =>
  TRANSITIONS[from].includes(to);

// Data tambahan yang diisi user saat pindah status (input kondisional).
export interface TransitionInput {
  cvVersion?: string;
  appliedDate?: string;
  interviewDateTime?: string;
  salaryOffer?: number;
  workMode?: WorkMode;
}

// Kembalikan pesan error, atau null kalau transisi sah & syarat terpenuhi.
export function validateTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
  input: TransitionInput,
): string | null {
  if (!canTransition(from, to)) return `Tidak boleh pindah dari ${from} ke ${to}.`;

  if (to === 'APPLIED' && (!input.cvVersion?.trim() || !input.appliedDate)) {
    return 'Ke APPLIED wajib isi versi CV dan tanggal melamar.';
  }
  if (to === 'INTERVIEW' && !input.interviewDateTime) {
    return 'Ke INTERVIEW wajib isi jadwal interview.';
  }
  if (to === 'OFFER' && (!(input.salaryOffer !== undefined && input.salaryOffer > 0) || !input.workMode)) {
    return 'Ke OFFER wajib isi gaji > 0 dan mode kerja.';
  }
  return null;
}

// Fungsi murni: hasilkan objek Application BARU (tanpa mutasi) dengan status baru,
// field syarat, lastUpdatedAt baru, dan 1 activity log otomatis.
export function applyTransition(
  app: Application,
  to: ApplicationStatus,
  input: TransitionInput,
): Application {
  let fields: Partial<Application> = {};
  let detail = '';

  if (to === 'APPLIED') {
    fields = { cvVersion: input.cvVersion?.trim(), appliedDate: input.appliedDate };
    detail = ` (CV: ${fields.cvVersion})`;
  } else if (to === 'INTERVIEW' && input.interviewDateTime) {
    fields = { interviewDateTime: input.interviewDateTime };
    detail = ` (jadwal ${formatDateTime(input.interviewDateTime)})`;
  } else if (to === 'OFFER' && input.salaryOffer !== undefined) {
    fields = { salaryOffer: input.salaryOffer, workMode: input.workMode };
    detail = ` (${formatRupiah(input.salaryOffer)}, ${input.workMode})`;
  }

  return {
    ...app,
    ...fields,
    status: to,
    lastUpdatedAt: new Date().toISOString(),
    activityLogs: [...app.activityLogs, createLog(`Status pindah ${app.status} → ${to}${detail}`)],
  };
}
