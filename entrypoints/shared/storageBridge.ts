import { browser } from 'wxt/browser';

function canUseDomStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function canUseExtensionStorage(): boolean {
  return Boolean(browser?.storage?.local && browser?.storage?.onChanged);
}

export function getStorageItem(key: string): string | null {
  if (!canUseDomStorage()) return null;
  return window.localStorage.getItem(key);
}

export function setStorageItem(key: string, value: string): void {
  if (!canUseDomStorage()) return;
  window.localStorage.setItem(key, value);
  if (canUseExtensionStorage()) {
    void browser.storage.local.set({ [key]: value });
  }
}

export function removeStorageItem(key: string): void {
  if (!canUseDomStorage()) return;
  window.localStorage.removeItem(key);
  if (canUseExtensionStorage()) {
    void browser.storage.local.remove(key);
  }
}

export async function initStorageBridge(keys: readonly string[]): Promise<void> {
  if (!canUseDomStorage()) return;
  if (!canUseExtensionStorage()) return;
  const remote = await browser.storage.local.get([...keys]);
  const updates: Record<string, string> = {};

  for (const key of keys) {
    const localValue = window.localStorage.getItem(key);
    const remoteRaw = remote[key];
    const remoteValue = typeof remoteRaw === 'string' ? remoteRaw : null;

    if (localValue === null && remoteValue !== null) {
      window.localStorage.setItem(key, remoteValue);
      continue;
    }

    if (localValue !== null && remoteValue !== localValue) {
      updates[key] = localValue;
    }
  }

  if (Object.keys(updates).length > 0) {
    await browser.storage.local.set(updates);
  }
}

export function subscribeToStorageKey(key: string, onValue: (value: string | null) => void): () => void {
  if (!canUseExtensionStorage()) {
    return () => {};
  }
  const listener: Parameters<typeof browser.storage.onChanged.addListener>[0] = (changes, areaName) => {
    if (areaName !== 'local') return;
    if (!(key in changes)) return;

    const change = changes[key];
    const nextRaw = change.newValue;
    const next = typeof nextRaw === 'string' ? nextRaw : null;
    if (canUseDomStorage()) {
      if (next === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, next);
      }
    }
    onValue(next);
  };

  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
