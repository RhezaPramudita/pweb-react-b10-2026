import type { JobListing } from '../types/index.ts';

const REMOTIVE_URL = 'https://remotive.com/api/remote-jobs?limit=40';
const FALLBACK_URL = '/magang-fallback.json';

// Ambil hanya field yang dipakai (respons Remotive juga berisi description HTML yang besar).
function normalize(raw: unknown): JobListing[] {
  const list = Array.isArray(raw) ? raw : (raw as { jobs?: unknown })?.jobs;
  if (!Array.isArray(list)) throw new Error('Format data lowongan tidak dikenali');

  return list.map((j: Partial<JobListing>) => ({
    id: Number(j.id),
    title: String(j.title ?? ''),
    company_name: String(j.company_name ?? ''),
    category: String(j.category ?? 'Lainnya'),
    candidate_required_location: String(j.candidate_required_location ?? ''),
    salary: String(j.salary ?? ''),
    tags: Array.isArray(j.tags) ? j.tags.map(String) : [],
  }));
}

async function getJson(url: string, signal?: AbortSignal): Promise<JobListing[]> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Gagal memuat lowongan (HTTP ${res.status})`);
  return normalize(await res.json());
}

// Sumber utama: Remotive API.
export const fetchRemoteJobs = (signal?: AbortSignal) => getJson(REMOTIVE_URL, signal);

// Cadangan: data lokal di public/magang-fallback.json.
export const fetchFallbackJobs = (signal?: AbortSignal) => getJson(FALLBACK_URL, signal);
