import { useEffect, type RefObject } from 'react';

// Bonus: tekan "/" untuk fokus ke search bar (lewat useRef), kecuali sedang mengetik di input lain.
export function useSearchShortcut(inputRef: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return;
      e.preventDefault(); // jangan sampai karakter "/" ikut terketik
      inputRef.current?.focus();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown); // cleanup saat unmount
  }, [inputRef]);
}
