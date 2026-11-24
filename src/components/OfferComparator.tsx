import type { Application } from '../types/index.ts';
import { OFFER_WEIGHTS, rankOffers } from '../utils/offerScore.ts';
import { formatRupiah, matchClass } from '../utils/format.ts';
import './warroom.css';
import './explore.css';

interface Props {
  applications: Application[];
  kaptenSkills: string[];
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

// Bandingkan semua lamaran berstatus OFFER; skor dihitung ulang tiap render (derived).
export function OfferComparator({ applications, kaptenSkills }: Props) {
  const ranked = rankOffers(applications, kaptenSkills);

  return (
    <section className="wr-panel">
      <h2>Bandingkan Offer</h2>
      <p className="wr-muted ex-gap-b">
        Skor = Gaji {pct(OFFER_WEIGHTS.salary)} (relatif ke gaji tertinggi) + Skill Match{' '}
        {pct(OFFER_WEIGHTS.match)} + Mode Kerja {pct(OFFER_WEIGHTS.workMode)} (Remote 100, Hybrid 75, Onsite 50).
      </p>

      {ranked.length === 0 ? (
        <p className="wr-empty">Belum ada lamaran berstatus OFFER untuk dibandingkan.</p>
      ) : (
        <>
          {ranked.length === 1 && (
            <p className="wr-muted ex-gap-b">Butuh minimal 2 offer agar bisa dibandingkan.</p>
          )}
          <div className="ex-table-wrap">
            <table className="ex-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Perusahaan / Posisi</th>
                  <th>Gaji</th>
                  <th>Mode Kerja</th>
                  <th>Match</th>
                  <th>Skor</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map(({ app, matchScore, total }, i) => {
                  const best = i === 0 && ranked.length > 1;
                  return (
                    <tr key={app.id} className={best ? 'ex-best' : undefined}>
                      <td>{i + 1}</td>
                      <td>
                        <strong>{app.company}</strong>
                        <div className="wr-muted">{app.role}</div>
                        {best && <span className="wr-badge wr-good">Offer Terbaik</span>}
                      </td>
                      <td>{formatRupiah(app.salaryOffer!)}</td>
                      <td>{app.workMode}</td>
                      <td>
                        <span className={`wr-badge ${matchClass(matchScore)}`}>{matchScore}%</span>
                      </td>
                      <td><strong>{total}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
