import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage.ts';

export type Theme = 'light' | 'dark';

// Bonus Dark Mode: pilihan tema disimpan via useLocalStorage agar tetap setelah refresh.
export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>(
    'theme',
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );

  // Sinkronkan ke <html data-theme="..."> supaya variabel CSS di index.css ikut berganti.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme };
}
