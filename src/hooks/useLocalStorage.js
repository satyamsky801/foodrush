import { useEffect, useState } from 'react';

/**
 * useState persisted to localStorage.
 * Handles JSON serialization + SSR-safe reads.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage may be unavailable (private mode) — fail silently.
    }
  }, [key, value]);

  return [value, setValue];
}
