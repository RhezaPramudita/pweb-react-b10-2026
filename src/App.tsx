import { useState } from 'react';
import { Compass, Moon, Scale, SquareKanban, Sun } from 'lucide-react';
import './App.css';
import type { Application } from './types/index.ts';
import { AddApplicationForm } from './components/AddApplicationForm.tsx';
import { ApplicationDetailModal } from './components/ApplicationDetailModal.tsx';
import { ConflictBanner } from './components/ConflictBanner.tsx';
import { DashboardStats } from './components/DashboardStats.tsx';
import { ExplorePage } from './components/ExplorePage.tsx';
import { OfferComparator } from './components/OfferComparator.tsx';
import { PipelinePage } from './components/PipelinePage.tsx';
import { UndoToast } from './components/UndoToast.tsx';
import { useApplications } from './hooks/useApplications.ts';
import { useLocalStorage } from './hooks/useLocalStorage.ts';
import { useTheme } from './hooks/useTheme.ts';

type Tab = 'explore' | 'pipeline' | 'offer';

const TABS: { id: Tab; label: string; short: string; Icon: typeof Compass }[] = [
  { id: 'explore', label: 'Eksplorasi Lowongan', short: 'Eksplorasi', Icon: Compass },
  { id: 'pipeline', label: 'Pipeline Lamaran', short: 'Pipeline', Icon: SquareKanban },
  { id: 'offer', label: 'Bandingkan Offer', short: 'Offer', Icon: Scale },
];

// Judul poster per tab.
const HERO: Record<Tab, { lines: string[]; sub: string }> = {
  explore: { lines: ['Cari', 'lowongan', 'yang cocok.'], sub: 'Bandingkan skill-mu dengan kebutuhan tiap lowongan.' },
  pipeline: { lines: ['Lacak', 'semua', 'lamaranmu.'], sub: 'Status, checklist, jadwal interview — satu tempat.' },
  offer: { lines: ['Pilih', 'offer', 'terbaik.'], sub: 'Skor berbobot: gaji, mode kerja, dan kecocokan skill.' },
};

function App() {
  const [tab, setTab] = useState<Tab>('pipeline');
  const [kaptenSkills, setKaptenSkills] = useLocalStorage<string[]>('kaptenSkills', ['React', 'TypeScript', 'CSS']);
  const {
    applications,
    setApplications,
    addApplication,
    simulateGhosting,
    deleteApplication,
    undoDelete,
    lastDeleted,
  } = useApplications();
  const { theme, toggleTheme } = useTheme();

  // Simpan id saja; objek lamaran di-derive dari state utama supaya selalu terbaru.
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailApp = applications.find((a) => a.id === detailId);

  // Terapkan updater ke 1 lamaran saja secara immutable (map + objek baru).
  function updateDetail(updater: (app: Application) => Application) {
    setApplications((prev) => prev.map((a) => (a.id === detailId ? updater(a) : a)));
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-logo" aria-hidden="true">AM.</span>
          <h1>Aku Mw Magang</h1>
        </div>
        <p className="app-tagline">Kelompok B10 — Pemweb 2026</p>
      </header>

      <main className="app-main">
        <section className="app-hero">
          <h2 className="display">
            {HERO[tab].lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p>{HERO[tab].sub}</p>
        </section>

        {/* Banner di luar tab & pakai seluruh data -> tetap tampil walau filter aktif */}
        <ConflictBanner applications={applications} />

        {tab === 'explore' && (
          <ExplorePage
            applications={applications}
            kaptenSkills={kaptenSkills}
            onChangeSkills={setKaptenSkills}
            onAdd={addApplication}
          />
        )}
        {tab === 'pipeline' && (
          <>
            <AddApplicationForm applications={applications} onAdd={addApplication} />
            <PipelinePage
              applications={applications}
              kaptenSkills={kaptenSkills}
              onSimulate={simulateGhosting}
              onDelete={deleteApplication}
              onOpenDetail={setDetailId}
            />
          </>
        )}
        {tab === 'offer' && (
          <>
            <DashboardStats applications={applications} />
            <OfferComparator applications={applications} kaptenSkills={kaptenSkills} />
          </>
        )}

      </main>

      {/* key = id: state modal (form transisi, timer) mulai bersih untuk tiap lamaran */}
      {detailApp && (
        <ApplicationDetailModal
          key={detailApp.id}
          application={detailApp}
          onUpdate={updateDetail}
          onClose={() => setDetailId(null)}
        />
      )}

      <nav className="app-dock" aria-label="Menu utama">
        <span className="app-dock-logo" aria-hidden="true">AM.</span>
        <div className="app-dock-tabs">
          {TABS.map(({ id, label, short, Icon }) => (
            <button
              key={id}
              type="button"
              className={tab === id ? 'app-dock-tab active' : 'app-dock-tab'}
              aria-current={tab === id ? 'page' : undefined}
              aria-label={label}
              onClick={() => setTab(id)}
            >
              <Icon size={16} aria-hidden="true" />
              <span className="app-dock-label">{short}</span>
              {id === 'pipeline' && <span className="app-count">{applications.length}</span>}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="app-dock-theme"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </nav>

      <UndoToast deleted={lastDeleted} onUndo={undoDelete} />
    </div>
  );
}

export default App;
