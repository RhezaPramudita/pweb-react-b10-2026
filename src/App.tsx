import { useState } from 'react';
import { AddApplicationForm } from './components/AddApplicationForm.tsx';
import { ConflictBanner } from './components/ConflictBanner.tsx';
import { DashboardStats } from './components/DashboardStats.tsx';
import { ExplorePage } from './components/ExplorePage.tsx';
import { OfferComparator } from './components/OfferComparator.tsx';
import { PipelinePage } from './components/PipelinePage.tsx';
import { UndoToast } from './components/UndoToast.tsx';
import { useApplications } from './hooks/useApplications.ts';
import { useLocalStorage } from './hooks/useLocalStorage.ts';

type Tab = 'explore' | 'pipeline' | 'offer';

function App() {
  const [tab, setTab] = useState<Tab>('pipeline');
  const [kaptenSkills, setKaptenSkills] = useLocalStorage<string[]>('kaptenSkills', ['React', 'TypeScript', 'CSS']);
  const {
    applications,
    addApplication,
    simulateGhosting,
    deleteApplication,
    undoDelete,
    lastDeleted,
  } = useApplications();

  return (
    <div style={{ padding: 16, display: 'grid', gap: 16 }}>
      <nav style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button type="button" onClick={() => setTab('explore')}>Eksplorasi Lowongan</button>
        <button type="button" onClick={() => setTab('pipeline')}>
          Pipeline Lamaran ({applications.length})
        </button>
        <button type="button" onClick={() => setTab('offer')}>Bandingkan Offer</button>
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
          />
        </>
      )}
      {tab === 'offer' && (
        <>
          <DashboardStats applications={applications} />
          <OfferComparator applications={applications} kaptenSkills={kaptenSkills} />
        </>
      )}

      <UndoToast deleted={lastDeleted} onUndo={undoDelete} />
    </div>
  );
}

export default App;
