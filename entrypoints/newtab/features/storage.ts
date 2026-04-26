import { getStorageItem, removeStorageItem, setStorageItem } from '../../shared/storageBridge';

export function readText(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return getStorageItem(key);
}

export function writeText(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  setStorageItem(key, value);
}

export function removeKey(key: string): void {
  if (typeof window === 'undefined') return;
  removeStorageItem(key);
}

export function readJson<T>(key: string): T | null {
  const raw = readText(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  writeText(key, JSON.stringify(value));
}
