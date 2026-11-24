import { useEffect, useState } from 'react';

// Mengembalikan `value` yang baru diperbarui setelah user berhenti mengetik selama `delay` ms.
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    // Cleanup: tiap ketikan baru membatalkan timer sebelumnya.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
