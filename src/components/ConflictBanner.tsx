import type { Application } from '../types/index.ts';
import { findInterviewConflicts } from '../utils/application.ts';
import { formatDateTime } from '../utils/format.ts';
import './warroom.css';

// Terima SELURUH applications (bukan yang ter-filter) agar banner tetap muncul saat filter aktif.
export function ConflictBanner({ applications }: { applications: Application[] }) {
  const conflicts = findInterviewConflicts(applications);
  if (conflicts.length === 0) return null;

  return (
    <div className="wr-banner" role="alert">
      <strong>Jadwal Interview Bentrok:</strong>
      <ul>
        {conflicts.map(([a, b]) => (
          <li key={`${a.id}-${b.id}`}>
            {a.company} ({formatDateTime(a.interviewDateTime!)}) dan {b.company} (
            {formatDateTime(b.interviewDateTime!)}) berselisih kurang dari 60 menit.
          </li>
        ))}
      </ul>
    </div>
  );
}
