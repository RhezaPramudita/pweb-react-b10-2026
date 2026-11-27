import { useEffect, useState } from 'react';
import type { Application, ApplicationStatus, WorkMode } from '../types/index.ts';
import { createLog } from '../utils/application.ts';
import { formatDateTime, formatRupiah } from '../utils/format.ts';
import { applyTransition, getNextStatuses, validateTransition } from '../utils/stateMachine.ts';
import { InterviewPrepTimer } from './InterviewPrepTimer.tsx';
import './warroom.css';
import './detail.css';

const STAGES: ApplicationStatus[] = ['WISHLIST', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER'];

// Input kondisional disimpan sebagai string (controlled input), diubah saat konfirmasi.
interface TransitionForm {
  cvVersion: string;
  appliedDate: string;
  interviewDateTime: string;
  salaryOffer: string;
  workMode: WorkMode;
}

interface Props {
  application: Application;
  // Updater fungsional: App yang menerapkannya ke state utama lewat map (immutable).
  onUpdate: (updater: (app: Application) => Application) => void;
  onClose: () => void;
}

export function ApplicationDetailModal({ application: app, onUpdate, onClose }: Props) {
  const [target, setTarget] = useState<ApplicationStatus | null>(null);
  const [form, setForm] = useState<TransitionForm>({
    cvVersion: app.cvVersion ?? '',
    appliedDate: app.appliedDate ?? '',
    interviewDateTime: app.interviewDateTime ?? '',
    salaryOffer: app.salaryOffer ? String(app.salaryOffer) : '',
    workMode: app.workMode,
  });
  const [transitionError, setTransitionError] = useState('');
  const [newItem, setNewItem] = useState('');
  const [note, setNote] = useState('');

  // Tutup modal dengan Escape. Listener dilepas lagi saat unmount (cleanup).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // ---- Derived state ----
  const nextStatuses = getNextStatuses(app.status); // hanya status tujuan yang sah
  const done = app.checklist.filter((c) => c.done).length;
  const total = app.checklist.length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  const stageIndex = STAGES.indexOf(app.status);
  const logs = app.activityLogs.toReversed(); // terbaru di atas, array asli tidak diubah

  function updateForm<K extends keyof TransitionForm>(key: K, value: TransitionForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function chooseTarget(status: ApplicationStatus) {
    setTarget(status);
    setTransitionError('');
  }

  function confirmTransition() {
    if (!target) return;
    const input = {
      cvVersion: form.cvVersion,
      appliedDate: form.appliedDate,
      interviewDateTime: form.interviewDateTime,
      salaryOffer: form.salaryOffer === '' ? undefined : Number(form.salaryOffer),
      workMode: form.workMode,
    };
    const error = validateTransition(app.status, target, input);
    if (error) {
      setTransitionError(error);
      return;
    }
    onUpdate((a) => applyTransition(a, target, input));
    setTarget(null);
    setTransitionError('');
  }

  // ---- Nested checklist: semua update immutable (spread / map / filter, tanpa push) ----
  function addItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = newItem.trim();
    if (!text) return;
    onUpdate((a) => ({
      ...a,
      checklist: [...a.checklist, { id: crypto.randomUUID(), text, done: false }],
    }));
    setNewItem('');
  }

  function toggleItem(itemId: string) {
    onUpdate((a) => ({
      ...a,
      checklist: a.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)),
    }));
  }

  function removeItem(itemId: string) {
    onUpdate((a) => ({ ...a, checklist: a.checklist.filter((c) => c.id !== itemId) }));
  }

  function addNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = note.trim();
    if (!text) return;
    onUpdate((a) => ({ ...a, activityLogs: [...a.activityLogs, createLog(`Catatan: ${text}`)] }));
    setNote('');
  }

  return (
    <div className="dm-backdrop" onClick={onClose}>
      <div
        className="wr-panel dm-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="dm-header">
          <div>
            <h2 id="dm-title">{app.role} — {app.company}</h2>
            <div className="wr-muted">
              {app.workMode}
              {app.cvVersion && ` • CV: ${app.cvVersion}`}
              {app.interviewDateTime && ` • Interview: ${formatDateTime(app.interviewDateTime)}`}
              {app.salaryOffer !== undefined && ` • Offer: ${formatRupiah(app.salaryOffer)}`}
            </div>
          </div>
          <div className="wr-badges">
            <span className={`wr-badge wr-status-${app.status.toLowerCase()}`}>{app.status}</span>
            <button type="button" className="wr-btn" onClick={onClose} aria-label="Tutup detail">✕</button>
          </div>
        </header>

        <div className="dm-grid">
          <div className="dm-col">
            {/* ---- Tahap seleksi + transisi status ---- */}
            <section className="dm-section">
              <h3>Tahap Seleksi</h3>
              <ol className="dm-stages">
                {STAGES.map((s, i) => (
                  <li key={s} className={stageIndex >= i ? 'dm-stage dm-stage-done' : 'dm-stage'}>
                    {i + 1}. {s}
                  </li>
                ))}
              </ol>

              {nextStatuses.length === 0 ? (
                <p className="wr-muted">Status {app.status} bersifat final, tidak bisa dipindah lagi.</p>
              ) : (
                <div className="dm-transition">
                  <div className="dm-row">
                    <span>Pindahkan status ke:</span>
                    {nextStatuses.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={target === s ? 'wr-btn wr-btn-primary' : 'wr-btn'}
                        aria-pressed={target === s}
                        onClick={() => chooseTarget(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {target === 'APPLIED' && (
                    <div className="dm-row">
                      <label>
                        Versi CV
                        <input
                          value={form.cvVersion}
                          onChange={(e) => updateForm('cvVersion', e.target.value)}
                          placeholder="Kapten-CV-v2.pdf"
                        />
                      </label>
                      <label>
                        Tanggal melamar
                        <input
                          type="date"
                          value={form.appliedDate}
                          onChange={(e) => updateForm('appliedDate', e.target.value)}
                        />
                      </label>
                    </div>
                  )}

                  {target === 'INTERVIEW' && (
                    <div className="dm-row">
                      <label>
                        Jadwal interview
                        <input
                          type="datetime-local"
                          value={form.interviewDateTime}
                          onChange={(e) => updateForm('interviewDateTime', e.target.value)}
                        />
                      </label>
                    </div>
                  )}

                  {target === 'OFFER' && (
                    <div className="dm-row">
                      <label>
                        Uang saku / gaji (Rp)
                        <input
                          type="number"
                          min={1}
                          value={form.salaryOffer}
                          onChange={(e) => updateForm('salaryOffer', e.target.value)}
                          placeholder="5500000"
                        />
                      </label>
                      <label>
                        Mode kerja
                        <select
                          value={form.workMode}
                          onChange={(e) => updateForm('workMode', e.target.value as WorkMode)}
                        >
                          <option value="Remote">Remote</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="Onsite">Onsite</option>
                        </select>
                      </label>
                    </div>
                  )}

                  {target && (
                    <div className="dm-row">
                      <button type="button" className="wr-btn wr-btn-primary" onClick={confirmTransition}>
                        Konfirmasi ke {target}
                      </button>
                      <button type="button" className="wr-btn" onClick={() => setTarget(null)}>Batal</button>
                    </div>
                  )}
                  {transitionError && <p className="wr-error" role="alert">{transitionError}</p>}
                </div>
              )}
            </section>

            {/* ---- Nested checklist ---- */}
            <section className="dm-section">
              <div className="dm-section-head">
                <h3>Daftar Persiapan</h3>
                <span className="wr-muted">{done} / {total} selesai</span>
              </div>
              <div
                className="dm-progress"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="dm-progress-bar" style={{ width: `${progress}%` }} />
              </div>

              {total === 0 ? (
                <p className="wr-muted">Belum ada item persiapan.</p>
              ) : (
                <ul className="dm-checklist">
                  {app.checklist.map((item) => (
                    <li key={item.id}>
                      <label className={item.done ? 'dm-done' : undefined}>
                        <input type="checkbox" checked={item.done} onChange={() => toggleItem(item.id)} />
                        {item.text}
                      </label>
                      <button
                        type="button"
                        className="dm-icon-btn"
                        aria-label={`Hapus ${item.text}`}
                        onClick={() => removeItem(item.id)}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <form className="dm-row" onSubmit={addItem}>
                <input
                  className="dm-grow"
                  aria-label="Tugas persiapan baru"
                  placeholder="Tambah tugas persiapan baru..."
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                />
                <button type="submit" className="wr-btn wr-btn-primary">Tambah</button>
              </form>
            </section>
          </div>

          <div className="dm-col">
            {/* Unmount saat modal ditutup -> cleanup timer berjalan */}
            <InterviewPrepTimer />

            {/* ---- Activity log ---- */}
            <section className="dm-section">
              <h3>Riwayat Aktivitas</h3>
              <form className="dm-row" onSubmit={addNote}>
                <input
                  className="dm-grow"
                  aria-label="Catatan manual"
                  placeholder="Tulis catatan..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <button type="submit" className="wr-btn">Catat</button>
              </form>
              <ol className="dm-logs">
                {logs.map((log) => (
                  <li key={log.id}>
                    <time className="wr-muted">{formatDateTime(log.timestamp)}</time>
                    <div>{log.message}</div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
