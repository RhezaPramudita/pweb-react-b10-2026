import { useEffect, useRef, useState } from 'react';
import { useSearchShortcut } from '../hooks/useSearchShortcut.ts';
import type { Application, JobListing, WorkMode } from '../types/index.ts';
import { fetchFallbackJobs, fetchRemoteJobs } from '../services/jobService.ts';
import { useDebounce } from '../hooks/useDebounce.ts';
import { createApplication, isDuplicate } from '../utils/application.ts';
import { getSkillMatch } from '../utils/skillMatch.ts';
import { matchClass } from '../utils/format.ts';
import { SkillProfile } from './SkillProfile.tsx';
import './warroom.css';
import './explore.css';

type Source = 'remote' | 'local';
type SortKey = 'match' | 'default';
type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; jobs: JobListing[] };

// Tebak mode kerja dari teks lokasi; Remotive isinya lowongan remote.
function inferWorkMode(location: string): WorkMode {
  const loc = location.toLowerCase();
  if (loc.includes('hybrid')) return 'Hybrid';
  if (loc.includes('onsite') || loc.includes('on-site')) return 'Onsite';
  return 'Remote';
}

interface Props {
  applications: Application[];
  kaptenSkills: string[];
  onChangeSkills: (skills: string[]) => void;
  onAdd: (app: Application) => void;
}

export function ExplorePage({ applications, kaptenSkills, onChangeSkills, onAdd }: Props) {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [source, setSource] = useState<Source>('remote');
  const [reloadKey, setReloadKey] = useState(0); // dinaikkan untuk "Coba Lagi"

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('match');
  const debouncedQuery = useDebounce(query, 400);
  const searchRef = useRef<HTMLInputElement>(null);
  useSearchShortcut(searchRef); // tekan "/" untuk fokus ke pencarian

  // Fetch lowongan. AbortController membatalkan request lama saat source berubah / unmount.
  useEffect(() => {
    const controller = new AbortController();
    const fetchJobs = source === 'remote' ? fetchRemoteJobs : fetchFallbackJobs;

    fetchJobs(controller.signal)
      .then((jobs) => setLoad({ status: 'success', jobs }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return; // dibatalkan oleh cleanup, bukan error
        setLoad({
          status: 'error',
          message: err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat lowongan.',
        });
      });

    return () => controller.abort(); // cleanup
  }, [source, reloadKey]);

  function retry() {
    setLoad({ status: 'loading' });
    setSource('remote');
    setReloadKey((k) => k + 1);
  }

  function loadFallback() {
    setLoad({ status: 'loading' });
    setSource('local');
    setReloadKey((k) => k + 1);
  }

  function saveToWishlist(job: JobListing) {
    onAdd(
      createApplication(
        {
          company: job.company_name,
          role: job.title,
          workMode: inferWorkMode(job.candidate_required_location),
          status: 'WISHLIST',
          requiredSkills: job.tags,
        },
        'Disimpan ke Wishlist dari Eksplorasi Lowongan',
      ),
    );
  }

  // ---- Derived state (tidak disimpan di useState) ----
  const jobs = load.status === 'success' ? load.jobs : [];
  const categories = [...new Set(jobs.map((j) => j.category))].toSorted();
  const q = debouncedQuery.trim().toLowerCase();

  const visible = jobs
    .map((job) => ({ job, match: getSkillMatch(kaptenSkills, job.tags) }))
    .filter(({ job }) =>
      q === '' ||
      `${job.title} ${job.company_name} ${job.tags.join(' ')}`.toLowerCase().includes(q),
    )
    .filter(({ job }) => category === 'ALL' || job.category === category)
    .toSorted((a, b) => (sortBy === 'match' ? b.match.score - a.match.score : 0));

  return (
    <div className="ex-page">
      <SkillProfile skills={kaptenSkills} onChange={onChangeSkills} />

      <section className="wr-panel">
        <div className="ex-head">
          <h2>Eksplorasi Lowongan</h2>
          <span className="wr-muted">
            Sumber: {source === 'remote' ? 'Remotive API' : 'Data Lokal (fallback)'}
          </span>
        </div>

        <div className="wr-filters">
          <input
            ref={searchRef}
            id="job-search"
            type="search"
            aria-label="Cari lowongan"
            placeholder="Cari posisi, perusahaan, atau skill... (tekan /)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select aria-label="Filter kategori" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="ALL">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select aria-label="Urutkan" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}>
            <option value="match">Match Tertinggi</option>
            <option value="default">Urutan Asli</option>
          </select>
        </div>
        {query !== debouncedQuery && <p className="wr-muted ex-gap-b">Mencari...</p>}

        {load.status === 'loading' && (
          <p className="wr-empty" role="status">Memuat lowongan...</p>
        )}

        {load.status === 'error' && (
          <div className="wr-empty ex-error" role="alert">
            <p>{load.message}</p>
            <div className="ex-error-actions">
              <button type="button" className="wr-btn wr-btn-primary" onClick={retry}>Coba Lagi</button>
              <button type="button" className="wr-btn" onClick={loadFallback}>Gunakan Fallback Lokal</button>
            </div>
          </div>
        )}

        {load.status === 'success' && visible.length === 0 && (
          <p className="wr-empty">
            {jobs.length === 0 ? 'Belum ada lowongan tersedia.' : 'Tidak ada lowongan yang cocok dengan pencarian / filter.'}
          </p>
        )}

        {load.status === 'success' && visible.length > 0 && (
          <ul className="wr-list">
            {visible.map(({ job, match }) => {
              const saved = isDuplicate(applications, job.company_name, job.title);
              return (
                <li key={job.id} className="wr-card">
                  <div className="wr-card-head">
                    <div>
                      <strong>{job.title}</strong>
                      <div className="wr-muted">
                        {job.company_name} • {job.candidate_required_location || 'Lokasi tidak disebutkan'}
                      </div>
                    </div>
                    <div className="wr-badges">
                      <span className="wr-badge">{job.category}</span>
                      <span className={`wr-badge ${matchClass(match.score)}`}>{match.score}% Match</span>
                    </div>
                  </div>

                  {job.salary && <p className="wr-muted ex-gap">Gaji: {job.salary}</p>}

                  {job.tags.length > 0 && (
                    <ul className="ex-tags ex-gap">
                      {job.tags.map((tag, i) => (
                        <li key={`${tag}-${i}`} className={match.missing.includes(tag) ? 'ex-tag ex-tag-missing' : 'ex-tag ex-tag-ok'}>
                          {tag}
                        </li>
                      ))}
                    </ul>
                  )}
                  {match.missing.length > 0 && (
                    <p className="ex-missing">Skill yang belum dimiliki: {match.missing.join(', ')}</p>
                  )}

                  <div className="wr-actions">
                    <button
                      type="button"
                      className={saved ? 'wr-btn' : 'wr-btn wr-btn-primary'}
                      disabled={saved}
                      onClick={() => saveToWishlist(job)}
                    >
                      {saved ? 'Sudah Dilamar' : 'Simpan ke Wishlist'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
