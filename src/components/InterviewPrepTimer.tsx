import { useEffect, useState } from 'react';

const DURATION = 120; // 02:00 per soal

const QUESTIONS = [
  'Perkenalkan dirimu dan ceritakan kenapa kamu tertarik magang di posisi ini.',
  'Ceritakan bug tersulit yang pernah kamu temui di proyekmu dan bagaimana cara kamu menyelesaikannya.',
  'Apa perbedaan state dan props di React? Kapan kamu memakai useEffect?',
  'Jelaskan apa yang terjadi dari saat kamu mengetik URL di browser sampai halaman tampil.',
  'Bagaimana kamu memakai Git saat bekerja dalam tim? Pernah menyelesaikan merge conflict?',
  'Ceritakan pengalaman bekerja dalam tim dan bagaimana kamu menangani perbedaan pendapat.',
];

const formatTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function InterviewPrepTimer() {
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [running, setRunning] = useState(false);

  // Derived: timer otomatis berhenti saat waktu habis (tanpa setState tambahan).
  const ticking = running && secondsLeft > 0;

  // Interval hanya hidup selama ticking. Cleanup clearInterval dipanggil saat
  // pause, waktu habis, atau komponen unmount (modal ditutup), jadi saat dibuka
  // lagi tidak ada interval ganda yang membuat detik berjalan 2x cepat.
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [ticking]);

  function reset() {
    setRunning(false);
    setSecondsLeft(DURATION);
  }

  function next() {
    setIndex((i) => (i + 1) % QUESTIONS.length);
    reset(); // soal berikutnya otomatis kembali ke 02:00
  }

  return (
    <section className="dm-section">
      <div className="dm-section-head">
        <h3>Latihan Interview</h3>
        <span className="wr-muted">Soal {index + 1} / {QUESTIONS.length}</span>
      </div>
      <p className="dm-question">"{QUESTIONS[index]}"</p>

      <div className="dm-timer">
        <span className={secondsLeft === 0 ? 'dm-time dm-time-up' : 'dm-time'} aria-live="polite">
          {formatTime(secondsLeft)}
        </span>
        <div className="wr-actions">
          <button
            type="button"
            className="wr-btn wr-btn-primary"
            onClick={() => setRunning((r) => !r)}
            disabled={secondsLeft === 0}
          >
            {ticking ? 'Pause' : 'Start'}
          </button>
          <button type="button" className="wr-btn" onClick={reset}>Reset</button>
          <button type="button" className="wr-btn" onClick={next}>Soal Berikutnya</button>
        </div>
      </div>
      {secondsLeft === 0 && <p className="wr-error">Waktu habis! Klik Reset atau lanjut ke soal berikutnya.</p>}
    </section>
  );
}
