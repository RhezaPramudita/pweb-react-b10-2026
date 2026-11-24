import { useEffect, useRef, useState } from 'react';
import type { Application } from '../types/index.ts';
import { shiftDays } from '../utils/application.ts';
import { useLocalStorage } from './useLocalStorage.ts';

const UNDO_MS = 5000;

// State utama daftar lamaran + aksi tambah, simulasi ghosting, hapus & undo.
export function useApplications() {
  const [applications, setApplications] = useLocalStorage<Application[]>('applications', []);
  const [lastDeleted, setLastDeleted] = useState<{ app: Application; index: number } | null>(null);
  const undoTimerRef = useRef<number | undefined>(undefined);

  // Bersihkan timer kalau komponen di-unmount.
  useEffect(() => () => clearTimeout(undoTimerRef.current), []);

  function addApplication(app: Application) {
    setApplications((prev) => [app, ...prev]);
  }

  function simulateGhosting(id: string) {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, lastUpdatedAt: shiftDays(a.lastUpdatedAt, 15) } : a)),
    );
  }

  function deleteApplication(id: string) {
    const index = applications.findIndex((a) => a.id === id);
    if (index === -1) return;

    // Hapus 2x berturut-turut < 5 detik: timer lama dibatalkan, toast pindah ke data terbaru.
    clearTimeout(undoTimerRef.current);
    setLastDeleted({ app: applications[index], index });
    setApplications((prev) => prev.filter((a) => a.id !== id));
    undoTimerRef.current = window.setTimeout(() => setLastDeleted(null), UNDO_MS);
  }

  function undoDelete() {
    if (!lastDeleted) return;
    clearTimeout(undoTimerRef.current);
    const { app, index } = lastDeleted;
    // Kembalikan utuh (termasuk checklist & activityLogs) ke posisi semula.
    setApplications((prev) => [...prev.slice(0, index), app, ...prev.slice(index)]);
    setLastDeleted(null);
  }

  return {
    applications,
    setApplications, // untuk C (state machine, checklist, log) & A (simpan ke wishlist)
    addApplication,
    simulateGhosting,
    deleteApplication,
    undoDelete,
    lastDeleted: lastDeleted?.app ?? null,
  };
}
