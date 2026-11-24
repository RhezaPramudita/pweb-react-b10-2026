import { useState } from 'react';
import './warroom.css';
import './explore.css';

interface Props {
  skills: string[];
  onChange: (skills: string[]) => void;
}

// Profil Skill Kapten: tambah / hapus skill, duplikat (case-insensitive) ditolak.
export function SkillProfile({ skills, onChange }: Props) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const skill = input.trim();
    if (!skill) {
      setError('Nama skill tidak boleh kosong.');
      return;
    }
    if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      setError(`Skill "${skill}" sudah ada di profil.`);
      return;
    }
    onChange([...skills, skill]); // immutable: array baru, bukan .push
    setInput('');
    setError('');
  }

  function handleRemove(skill: string) {
    onChange(skills.filter((s) => s !== skill));
  }

  return (
    <section className="wr-panel">
      <h2>Profil Skill Kapten</h2>

      <form className="ex-skill-form" onSubmit={handleAdd} noValidate>
        <input
          aria-label="Skill baru"
          placeholder="Tambah skill, mis. Docker"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError('');
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'skill-error' : undefined}
        />
        <button type="submit" className="wr-btn wr-btn-primary">Tambah</button>
      </form>
      {error && <p id="skill-error" className="wr-error">{error}</p>}

      {skills.length === 0 ? (
        <p className="wr-muted ex-gap">Belum ada skill. Tambahkan agar Match % bisa dihitung.</p>
      ) : (
        <ul className="ex-chips ex-gap">
          {skills.map((skill) => (
            <li key={skill} className="ex-chip">
              {skill}
              <button type="button" aria-label={`Hapus skill ${skill}`} onClick={() => handleRemove(skill)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
