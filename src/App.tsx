import { useState } from 'react';
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
    <div style={{ padding: 16, display: 'grid', gap: 16 }}>
      <nav style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => setTab('explore')}>Eksplorasi Lowongan</button>
        <button type="button" onClick={() => setTab('pipeline')}>
          Pipeline Lamaran ({applications.length})
        </button>
        <button type="button" onClick={() => setTab('offer')}>Bandingkan Offer</button>
        <button type="button" onClick={toggleTheme} aria-label="Ganti tema">
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </nav>

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

      {/* key = id: state modal (form transisi, timer) mulai bersih untuk tiap lamaran */}
      {detailApp && (
        <ApplicationDetailModal
          key={detailApp.id}
          application={detailApp}
          onUpdate={updateDetail}
          onClose={() => setDetailId(null)}
        />
      )}

      <UndoToast deleted={lastDeleted} onUndo={undoDelete} />
    </div>
  );
}

export default App;
