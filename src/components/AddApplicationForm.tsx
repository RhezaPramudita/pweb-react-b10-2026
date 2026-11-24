import { useRef, useState } from 'react';
import type { Application, WorkMode } from '../types/index.ts';
import { createApplication, isDuplicate } from '../utils/application.ts';
import './warroom.css';

interface FormState {
  company: string;
  role: string;
  workMode: WorkMode;
  status: 'WISHLIST' | 'APPLIED';
  skills: string; // dipisah koma, diubah ke string[] saat submit
  cvVersion: string;
  appliedDate: string;
}

type Field = 'company' | 'role' | 'skills' | 'cvVersion' | 'appliedDate';
type Errors = Partial<Record<Field, string>>;

const EMPTY_FORM: FormState = {
  company: '',
  role: '',
  workMode: 'Remote',
  status: 'WISHLIST',
  skills: '',
  cvVersion: '',
  appliedDate: '',
};

// Urutan field di layar = urutan pengecekan error untuk auto-focus.
const FIELD_ORDER: Field[] = ['company', 'role', 'skills', 'cvVersion', 'appliedDate'];

const parseSkills = (text: string) =>
  text.split(',').map((s) => s.trim()).filter((s) => s !== '');

interface Props {
  applications: Application[];
  onAdd: (app: Application) => void;
}

export function AddApplicationForm({ applications, onAdd }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});

  const companyRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const skillsRef = useRef<HTMLInputElement>(null);
  const cvVersionRef = useRef<HTMLInputElement>(null);
  const appliedDateRef = useRef<HTMLInputElement>(null);
  const refs = {
    company: companyRef,
    role: roleRef,
    skills: skillsRef,
    cvVersion: cvVersionRef,
    appliedDate: appliedDateRef,
  };

  // Satu fungsi untuk semua input: salin objek lama, ganti 1 field (immutable).
  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!form.company.trim()) e.company = 'Perusahaan wajib diisi.';
    if (!form.role.trim()) e.role = 'Posisi/role wajib diisi.';
    if (!e.company && !e.role && isDuplicate(applications, form.company, form.role)) {
      e.company = 'Lamaran dengan perusahaan + posisi ini sudah ada.';
    }
    if (parseSkills(form.skills).length === 0) e.skills = 'Isi minimal 1 skill.';
    if (form.status === 'APPLIED') {
      if (!form.cvVersion.trim()) e.cvVersion = 'Versi CV wajib diisi untuk status APPLIED.';
      if (!form.appliedDate) e.appliedDate = 'Tanggal melamar wajib diisi untuk status APPLIED.';
    }
    return e;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);

    const firstError = FIELD_ORDER.find((field) => newErrors[field]);
    if (firstError) {
      refs[firstError].current?.focus(); // useRef: arahkan kursor ke input error pertama
      return;
    }

    const isApplied = form.status === 'APPLIED';
    const app = createApplication(
      {
        company: form.company.trim(),
        role: form.role.trim(),
        workMode: form.workMode,
        status: form.status,
        requiredSkills: parseSkills(form.skills),
        ...(isApplied && { cvVersion: form.cvVersion.trim(), appliedDate: form.appliedDate }),
      },
      isApplied
        ? `Lamaran dicatat sebagai APPLIED (CV: ${form.cvVersion.trim()})`
        : 'Lamaran dicatat ke Wishlist (input manual)',
    );
    onAdd(app);
    setForm(EMPTY_FORM);
  }

  // Props bersama untuk input teks: value + onChange (controlled) + error a11y.
  const textField = (field: Field, key: keyof FormState) => ({
    id: `form-${field}`,
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => update(key, e.target.value),
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `form-${field}-error` : undefined,
  });

  const errorText = (field: Field) =>
    errors[field] && (
      <span id={`form-${field}-error`} className="wr-error">
        {errors[field]}
      </span>
    );

  return (
    <form className="wr-panel wr-form" onSubmit={handleSubmit} noValidate>
      <h2>Catat Lamaran Manual</h2>

      <div className="wr-form-grid">
        <label htmlFor="form-company">
          Perusahaan
          <input ref={companyRef} {...textField('company', 'company')} placeholder="mis. Garuda FinTech" />
          {errorText('company')}
        </label>

        <label htmlFor="form-role">
          Posisi / Role
          <input ref={roleRef} {...textField('role', 'role')} placeholder="mis. Frontend Intern" />
          {errorText('role')}
        </label>

        <label htmlFor="form-workMode">
          Mode Kerja
          <select
            id="form-workMode"
            value={form.workMode}
            onChange={(e) => update('workMode', e.target.value as WorkMode)}
          >
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Onsite">Onsite</option>
          </select>
        </label>

        <label htmlFor="form-status">
          Status Awal
          <select
            id="form-status"
            value={form.status}
            onChange={(e) => update('status', e.target.value as FormState['status'])}
          >
            <option value="WISHLIST">WISHLIST</option>
            <option value="APPLIED">APPLIED</option>
          </select>
        </label>

        <label htmlFor="form-skills" className="wr-span-2">
          Required Skills (pisahkan dengan koma)
          <input ref={skillsRef} {...textField('skills', 'skills')} placeholder="React, TypeScript, CSS" />
          {errorText('skills')}
        </label>

        {form.status === 'APPLIED' && (
          <>
            <label htmlFor="form-cvVersion">
              Versi CV
              <input ref={cvVersionRef} {...textField('cvVersion', 'cvVersion')} placeholder="Kapten-CV-v2.pdf" />
              {errorText('cvVersion')}
            </label>

            <label htmlFor="form-appliedDate">
              Tanggal Melamar
              <input ref={appliedDateRef} {...textField('appliedDate', 'appliedDate')} type="date" />
              {errorText('appliedDate')}
            </label>
          </>
        )}
      </div>

      <button type="submit" className="wr-btn wr-btn-primary">
        Simpan Lamaran
      </button>
    </form>
  );
}
