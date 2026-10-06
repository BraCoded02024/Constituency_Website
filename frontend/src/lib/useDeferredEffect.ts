import { useEffect, type DependencyList } from 'react';

/**
 * Runs `fn` on a macrotask so setState inside data-fetch helpers
 * is not synchronous in the effect body (react-hooks/set-state-in-effect).
 */
export function useDeferredEffect(fn: () => void | (() => void), deps: DependencyList) {
  useEffect(() => {
    let cleanup: void | (() => void);
    const timer = setTimeout(() => {
      cleanup = fn();
    }, 0);
    return () => {
      clearTimeout(timer);
      if (typeof cleanup === 'function') cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller owns deps
  }, deps);
}
