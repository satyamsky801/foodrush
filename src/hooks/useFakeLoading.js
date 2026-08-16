import { useEffect, useState } from 'react';

/**
 * Simulates a network fetch so loading skeletons are visible in the demo.
 * Re-triggers whenever any value in `deps` changes.
 */
export function useFakeLoading(deps = [], delay = 550) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);

  return loading;
}
