// Warna badge Match: hijau >= 70, kuning 40-69, merah < 40.
export const matchClass = (score: number) =>
  score >= 70 ? 'wr-good' : score >= 40 ? 'wr-warn' : 'wr-bad';

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

export const formatRupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
