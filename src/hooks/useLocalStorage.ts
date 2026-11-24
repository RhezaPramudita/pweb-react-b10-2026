import { useEffect, useState } from 'react';

// Seperti useState, tapi nilainya disimpan di localStorage agar tidak hilang saat refresh.
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Lazy initializer: localStorage hanya dibaca sekali saat mount pertama.
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved === null ? initialValue : (JSON.parse(saved) as T);
    } catch {
      return initialValue; // data rusak / bukan JSON -> pakai nilai awal
    }
  });

  // Setiap value berubah, tulis ulang ke localStorage.
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage penuh / diblokir browser: state di memori tetap jalan
    }
  }, [key, value]);

  return [value, setValue] as const;
}
