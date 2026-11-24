import type { Application } from '../types/index.ts';
import { isRawanGhosting } from '../utils/application.ts';
import './warroom.css';
import './explore.css';

// 5 kartu statistik. Semua nilai derived state: dihitung dari `applications` tiap render, tanpa useState.
export function DashboardStats({ applications }: { applications: Application[] }) {
  const count = (status: Application['status']) => applications.filter((a) => a.status === status).length;

  const stats = [
    { label: 'Total Lamaran', value: applications.length },
    {
      label: 'Sedang Diproses',
      value: applications.filter((a) => ['APPLIED', 'SCREENING', 'INTERVIEW'].includes(a.status)).length,
    },
    { label: 'Interview', value: count('INTERVIEW') },
    { label: 'Offer', value: count('OFFER') },
    { label: 'Rawan Ghosting', value: applications.filter((a) => isRawanGhosting(a)).length, danger: true },
  ];

  return (
    <section className="wr-panel">
      <h2>Dashboard</h2>
      <ul className="ex-stats">
        {stats.map((s) => (
          <li key={s.label} className={s.danger && s.value > 0 ? 'ex-stat ex-stat-danger' : 'ex-stat'}>
            <span className="ex-stat-value">{s.value}</span>
            <span className="ex-stat-label">{s.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
