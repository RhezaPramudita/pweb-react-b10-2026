import { useState } from 'react';
import type { Application, ApplicationStatus } from '../types/index.ts';
import { isRawanGhosting } from '../utils/application.ts';
import { getSkillMatch } from '../utils/skillMatch.ts';
import { formatDateTime, formatRupiah, matchClass } from '../utils/format.ts';
import './warroom.css';

type SortKey = 'newest' | 'interview' | 'offer';

const STATUSES: ApplicationStatus[] = [
  'WISHLIST', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED',
];

// Lamaran tanpa jadwal interview ditaruh paling bawah.
const interviewTime = (a: Application) =>
  a.status === 'INTERVIEW' && a.interviewDateTime ? Date.parse(a.interviewDateTime) : Infinity;

const COMPARATORS: Record<SortKey, (a: Application, b: Application) => number> = {
  newest: (a, b) => Date.parse(b.lastUpdatedAt) - Date.parse(a.lastUpdatedAt),
  interview: (a, b) => {
    const ta = interviewTime(a);
    const tb = interviewTime(b);
    return ta === tb ? 0 : ta < tb ? -1 : 1; // Infinity - Infinity = NaN, jadi dibandingkan manual
  },
  offer: (a, b) => (b.salaryOffer ?? 0) - (a.salaryOffer ?? 0),
};

interface Props {
  applications: Application[];
  kaptenSkills: string[];
  onSimulate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PipelinePage({ applications, kaptenSkills, onSimulate, onDelete }: Props) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [onlyGhosting, setOnlyGhosting] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('newest');

  // Derived state: dihitung ulang tiap render, tidak disimpan ke useState.
  const q = query.trim().toLowerCase();
  const visible = applications
    .filter((a) => q === '' || `${a.company} ${a.role}`.toLowerCase().includes(q))
    .filter((a) => statusFilter === 'ALL' || a.status === statusFilter)
    .filter((a) => !onlyGhosting || isRawanGhosting(a))
    .toSorted(COMPARATORS[sortBy]); // toSorted = sort tanpa mengubah array asli

  return (
    <section className="wr-panel">
      <h2>Pipeline Lamaran ({applications.length})</h2>

      <div className="wr-filters">
        <input
          type="search"
          aria-label="Cari perusahaan atau posisi"
          placeholder="Cari perusahaan atau posisi..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filter status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'ALL')}
        >
          <option value="ALL">Semua Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Urutkan"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
        >
          <option value="newest">Terbaru</option>
          <option value="interview">Jadwal Interview Terdekat</option>
          <option value="offer">Offer Tertinggi</option>
        </select>
        <label className="wr-toggle">
          <input
            type="checkbox"
            checked={onlyGhosting}
            onChange={(e) => setOnlyGhosting(e.target.checked)}
          />
          Hanya Rawan Ghosting
        </label>
      </div>

      {applications.length === 0 ? (
        <p className="wr-empty">Belum ada lamaran. Simpan dari Eksplorasi Lowongan atau catat manual.</p>
      ) : visible.length === 0 ? (
        <p className="wr-empty">Tidak ada lamaran yang cocok dengan filter.</p>
      ) : (
        <ul className="wr-list">
          {visible.map((app) => {
            const match = getSkillMatch(kaptenSkills, app.requiredSkills).score;
            const done = app.checklist.filter((c) => c.done).length;
            const canSimulate = app.status === 'APPLIED' || app.status === 'SCREENING';
            return (
              <li key={app.id} className="wr-card">
                <div className="wr-card-head">
                  <div>
                    <strong>{app.role}</strong>
                    <div className="wr-muted">{app.company} • {app.workMode}</div>
                  </div>
                  <div className="wr-badges">
                    {isRawanGhosting(app) && <span className="wr-badge wr-bad">Rawan Ghosting</span>}
                    <span className={`wr-badge wr-status-${app.status.toLowerCase()}`}>{app.status}</span>
                    <span className={`wr-badge ${matchClass(match)}`}>{match}% Match</span>
                  </div>
                </div>

                <dl className="wr-meta">
                  <div><dt>CV</dt><dd>{app.cvVersion ?? '-'}</dd></div>
                  <div><dt>Checklist</dt><dd>{done}/{app.checklist.length}</dd></div>
                  {app.interviewDateTime && (
                    <div><dt>Interview</dt><dd>{formatDateTime(app.interviewDateTime)}</dd></div>
                  )}
                  {app.salaryOffer !== undefined && (
                    <div><dt>Offer</dt><dd>{formatRupiah(app.salaryOffer)}</dd></div>
                  )}
                  <div><dt>Update terakhir</dt><dd>{formatDateTime(app.lastUpdatedAt)}</dd></div>
                </dl>

                <div className="wr-actions">
                  {canSimulate && (
                    <button type="button" className="wr-btn" onClick={() => onSimulate(app.id)}>
                      Simulasi +15 Hari
                    </button>
                  )}
                  <button type="button" className="wr-btn wr-btn-danger" onClick={() => onDelete(app.id)}>
                    Hapus
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
