import { useSyncExternalStore } from 'react';

const STORAGE_EVENT = 'cms-local-storage';

const emptySubscribe = () => () => {};

function subscribeLocalStorage(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const onChange = () => onStoreChange();
  window.addEventListener('storage', onChange);
  window.addEventListener(STORAGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(STORAGE_EVENT, onChange);
  };
}

/** True after hydration; false during SSR so markup can match. */
export function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function writeLocalStorage(key: string, value: string | null) {
  if (typeof window === 'undefined') return;
  if (value === null) window.localStorage.removeItem(key);
  else window.localStorage.setItem(key, value);
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

/** Client snapshot of a localStorage key; always null on the server. */
export function useLocalStorageRaw(key: string): string | null {
  return useSyncExternalStore(
    subscribeLocalStorage,
    () => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
}
