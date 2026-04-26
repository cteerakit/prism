import type { LucideIcon } from 'lucide-react';
import { AudioWaveform, Bird, CloudLightning, CloudRain, Coffee, Flame, Headphones, Trees, Wind } from 'lucide-react';
import { readText, writeJson } from './storage';

export type Position = {
  x: number;
  y: number;
};

export type CardId = 'timer' | 'countdown' | 'todos' | 'audio' | 'music' | 'note' | 'bookmarks';

export type CardContextMenuState = {
  cardId: CardId;
  x: number;
  y: number;
};

export type WallpaperContextMenuState = {
  x: number;
  y: number;
};

export type ClockContextMenuState = {
  x: number;
  y: number;
};

export type PreferenceId =
  | 'showBackgroundDimmer'
  | 'showBackgroundBlur'
  | 'showCenterTime'
  | 'showCenterDate'
  | 'use24HourTime'
  | 'showAmPm'
  | 'showBookmarkBar';

export type BackgroundId = 'ios-blue' | 'ios-purple' | 'ios-indigo' | 'ios-sunrise' | 'ios-midnight' | 'ios-light' | 'custom';

export type CustomWallpaperMeta = {
  url: string;
};

export type ThemeId = 'cyan' | 'violet' | 'emerald' | 'rose' | 'amber' | 'indigo' | 'teal' | 'fuchsia';

export type ThemeOption = {
  id: ThemeId;
  name: string;
  accent: string;
  accentSoftBg: string;
  accentSoftBorder: string;
  accentText: string;
};

export type PomodoroPhase = 'focus' | 'break';

export type PomodoroSnapshot = {
  phase: PomodoroPhase;
  secondsLeft: number;
  isRunning: boolean;
  completedPomodoros: number;
  lastUpdatedAt: number;
};

export type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

export type AmbientChannelId = 'rain' | 'cafe' | 'lofi' | 'wind' | 'fireplace' | 'forest' | 'thunder' | 'birds' | 'whiteNoise';
export type AmbientMixerEnabled = Record<AmbientChannelId, boolean>;

export type ClockSize = 'small' | 'medium' | 'large';
export type ClockPosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

export type AmbientAudioBroadcastMessage =
  | { type: 'stop-engine'; tabId: string }
  | { type: 'ambient-master-volume'; tabId: string; value: number }
  | { type: 'music-volume'; tabId: string; value: number };

export const CARD_POSITIONS_STORAGE_KEY = 'newtab-card-positions';
export const VISIBLE_CARDS_STORAGE_KEY = 'newtab-visible-cards';
export const VISIBLE_DOCK_ITEMS_STORAGE_KEY = 'newtab-visible-dock-items';
export const SELECTED_BACKGROUND_STORAGE_KEY = 'newtab-selected-background';
export const SELECTED_THEME_STORAGE_KEY = 'newtab-selected-theme';
export const POMODORO_STORAGE_KEY = 'newtab-pomodoro-state';
export const QUICK_NOTE_STORAGE_KEY = 'newtab-quick-note';
export const TODO_LIST_STORAGE_KEY = 'newtab-todo-list';
export const COUNTDOWN_TARGET_STORAGE_KEY = 'newtab-countdown-target';
export const AMBIENT_MIXER_ENABLED_STORAGE_KEY = 'newtab-ambient-mixer-enabled';
export const PREFERENCES_STORAGE_KEY = 'newtab-preferences';
export const CLOCK_SIZE_STORAGE_KEY = 'newtab-clock-size';
export const CLOCK_POSITION_STORAGE_KEY = 'newtab-clock-position';
export const CUSTOM_WALLPAPER_META_STORAGE_KEY = 'newtab-custom-wallpaper-meta';
export const AMBIENT_SESSION_ACTIVE_STORAGE_KEY = 'newtab-ambient-session-active';
export const AMBIENT_SESSION_OWNER_TAB_STORAGE_KEY = 'newtab-ambient-session-owner-tab';
export const AMBIENT_MASTER_VOLUME_STORAGE_KEY = 'newtab-ambient-master-volume';
export const AMBIENT_AUDIO_BROADCAST_CHANNEL = 'prism-ambient-audio';
export const LOFI_MUSIC_VOLUME_STORAGE_KEY = 'newtab-lofi-music-volume';

export const MAX_CUSTOM_WALLPAPER_DATA_URL_LENGTH = 3_500_000;
/** Fixed loudness when a channel is on (no per-channel sliders). */
export const AMBIENT_CHANNEL_LEVEL = 0.72;
export const POMODORO_FOCUS_SECONDS = 25 * 60;
export const POMODORO_BREAK_SECONDS = 5 * 60;

export const CLOCK_POSITIONS: ClockPosition[] = [
  'top-left',
  'top',
  'top-right',
  'left',
  'center',
  'right',
  'bottom-left',
  'bottom',
  'bottom-right',
];

export const CLOCK_POSITION_LABELS: Record<ClockPosition, string> = {
  'top-left': 'Top left',
  top: 'Top',
  'top-right': 'Top right',
  left: 'Left',
  center: 'Center',
  right: 'Right',
  'bottom-left': 'Bottom left',
  bottom: 'Bottom',
  'bottom-right': 'Bottom right',
};

export const ambientChannelMeta: Array<{ id: AmbientChannelId; label: string; description: string; Icon: LucideIcon }> = [
  { id: 'rain', label: 'Rain', description: 'Filtered noise bed for soft rainfall texture.', Icon: CloudRain },
  { id: 'cafe', label: 'Cafe', description: 'Warm mid-band room murmur and chatter feel.', Icon: Coffee },
  { id: 'lofi', label: 'Lo-fi', description: 'Gentle layered tones for a calm study vibe.', Icon: Headphones },
  { id: 'wind', label: 'Wind', description: 'Low airy whoosh with smooth movement.', Icon: Wind },
  { id: 'fireplace', label: 'Fireplace', description: 'Warm crackle-like band noise layer.', Icon: Flame },
  { id: 'forest', label: 'Forest', description: 'Soft rustling highs with woodland depth.', Icon: Trees },
  { id: 'thunder', label: 'Thunder', description: 'Distant low rumbles with occasional emphasis.', Icon: CloudLightning },
  { id: 'birds', label: 'Birds', description: 'Light chirps and calls in sparse patterns.', Icon: Bird },
  { id: 'whiteNoise', label: 'White noise', description: 'Even full-spectrum hiss for masking.', Icon: AudioWaveform },
];

export const themeOptions: ThemeOption[] = [
  {
    id: 'cyan',
    name: 'Cyan',
    accent: '#22d3ee',
    accentSoftBg: 'rgba(34, 211, 238, 0.22)',
    accentSoftBorder: 'rgba(165, 243, 252, 0.75)',
    accentText: '#cffafe',
  },
  {
    id: 'violet',
    name: 'Violet',
    accent: '#a78bfa',
    accentSoftBg: 'rgba(167, 139, 250, 0.24)',
    accentSoftBorder: 'rgba(221, 214, 254, 0.78)',
    accentText: '#ede9fe',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    accent: '#34d399',
    accentSoftBg: 'rgba(52, 211, 153, 0.22)',
    accentSoftBorder: 'rgba(167, 243, 208, 0.75)',
    accentText: '#d1fae5',
  },
  {
    id: 'rose',
    name: 'Rose',
    accent: '#fb7185',
    accentSoftBg: 'rgba(251, 113, 133, 0.22)',
    accentSoftBorder: 'rgba(254, 205, 211, 0.75)',
    accentText: '#ffe4e6',
  },
  {
    id: 'amber',
    name: 'Amber',
    accent: '#f59e0b',
    accentSoftBg: 'rgba(245, 158, 11, 0.22)',
    accentSoftBorder: 'rgba(253, 230, 138, 0.75)',
    accentText: '#fef3c7',
  },
  {
    id: 'indigo',
    name: 'Indigo',
    accent: '#6366f1',
    accentSoftBg: 'rgba(99, 102, 241, 0.22)',
    accentSoftBorder: 'rgba(199, 210, 254, 0.78)',
    accentText: '#e0e7ff',
  },
  {
    id: 'teal',
    name: 'Teal',
    accent: '#14b8a6',
    accentSoftBg: 'rgba(20, 184, 166, 0.22)',
    accentSoftBorder: 'rgba(153, 246, 228, 0.78)',
    accentText: '#ccfbf1',
  },
  {
    id: 'fuchsia',
    name: 'Fuchsia',
    accent: '#d946ef',
    accentSoftBg: 'rgba(217, 70, 239, 0.22)',
    accentSoftBorder: 'rgba(245, 208, 254, 0.78)',
    accentText: '#fae8ff',
  },
];

function makeGradientWallpaper(stops: string[]): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">${stops
    .map((stop, index) => {
      const pct = Math.round((index / Math.max(stops.length - 1, 1)) * 100);
      return `<stop offset="${pct}%" stop-color="${stop}"/>`;
    })
    .join('')}</linearGradient></defs><rect width="1920" height="1080" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const backgroundOptions: Array<{ id: BackgroundId; name: string; imageUrl: string }> = [
  {
    id: 'ios-blue',
    name: 'Blue Nebula',
    imageUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'ios-indigo',
    name: 'Indigo Horizon',
    imageUrl: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'ios-purple',
    name: 'Purple Night Sky',
    imageUrl: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'ios-sunrise',
    name: 'Golden Sunrise',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'ios-midnight',
    name: 'Midnight Desert',
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'ios-light',
    name: 'iOS Light',
    imageUrl: makeGradientWallpaper(['#f8fafc', '#e2e8f0', '#cbd5e1']),
  },
];

export const defaultCardPositions: Record<CardId, Position> = {
  timer: { x: 0, y: 0 },
  countdown: { x: 0, y: 0 },
  todos: { x: 0, y: 0 },
  audio: { x: 0, y: 0 },
  music: { x: 0, y: 0 },
  note: { x: 0, y: 0 },
  bookmarks: { x: 0, y: 0 },
};

export const defaultCardVisibility: Record<CardId, boolean> = {
  timer: false,
  countdown: false,
  todos: false,
  audio: false,
  music: false,
  note: false,
  bookmarks: false,
};

export const defaultDockItemVisibility: Record<CardId, boolean> = {
  timer: true,
  countdown: true,
  todos: true,
  audio: true,
  music: true,
  note: true,
  bookmarks: true,
};

export function getPomodoroDuration(phase: PomodoroPhase) {
  return phase === 'focus' ? POMODORO_FOCUS_SECONDS : POMODORO_BREAK_SECONDS;
}

const MAX_STORED_DRAG_OFFSET = 6000;
const DEFAULT_AMBIENT_ENABLED: AmbientMixerEnabled = {
  rain: true,
  cafe: true,
  lofi: true,
  wind: false,
  fireplace: false,
  forest: false,
  thunder: false,
  birds: false,
  whiteNoise: false,
};

export function sanitizePosition(p: Partial<Position> | undefined): Position {
  const x = typeof p?.x === 'number' && Number.isFinite(p.x) ? p.x : 0;
  const y = typeof p?.y === 'number' && Number.isFinite(p.y) ? p.y : 0;
  return {
    x: Math.max(-MAX_STORED_DRAG_OFFSET, Math.min(MAX_STORED_DRAG_OFFSET, x)),
    y: Math.max(-MAX_STORED_DRAG_OFFSET, Math.min(MAX_STORED_DRAG_OFFSET, y)),
  };
}

export function loadCustomWallpaperFromStorage(): CustomWallpaperMeta | null {
  if (typeof window === 'undefined') return null;
  const raw = readText(CUSTOM_WALLPAPER_META_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CustomWallpaperMeta;
    if (typeof parsed.url !== 'string' || !/^(https?:\/\/|data:image\/)/i.test(parsed.url)) return null;
    return {
      url: parsed.url,
    };
  } catch {
    return null;
  }
}

export function defaultPreferences(): Record<PreferenceId, boolean> {
  return {
    showBackgroundDimmer: true,
    showBackgroundBlur: false,
    showCenterTime: true,
    showCenterDate: true,
    use24HourTime: false,
    showAmPm: false,
    showBookmarkBar: false,
  };
}

export function loadStoredPreferences(): Record<PreferenceId, boolean> {
  const defaults = defaultPreferences();
  if (typeof window === 'undefined') return defaults;
  const raw = readText(PREFERENCES_STORAGE_KEY);
  if (!raw) return defaults;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      ...defaults,
      ...Object.fromEntries(
        (Object.keys(defaults) as PreferenceId[]).map((id) => [
          id,
          typeof parsed[id] === 'boolean' ? (parsed[id] as boolean) : defaults[id],
        ]),
      ),
    } as Record<PreferenceId, boolean>;
  } catch {
    return defaults;
  }
}

export function loadStoredClockSize(): ClockSize {
  if (typeof window === 'undefined') return 'large';
  const raw = readText(CLOCK_SIZE_STORAGE_KEY);
  if (raw === 'small' || raw === 'medium' || raw === 'large') return raw;
  return 'large';
}

export function loadStoredClockPosition(): ClockPosition {
  if (typeof window === 'undefined') return 'center';
  const raw = readText(CLOCK_POSITION_STORAGE_KEY);
  return CLOCK_POSITIONS.includes(raw as ClockPosition) ? (raw as ClockPosition) : 'center';
}

export function isoToDatetimeLocalValue(iso: string): string {
  if (!iso.trim()) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function advancePomodoroSnapshot(snapshot: PomodoroSnapshot, nowMs: number): PomodoroSnapshot {
  if (!snapshot.isRunning) {
    return {
      ...snapshot,
      lastUpdatedAt: nowMs,
    };
  }

  let elapsedSeconds = Math.floor((nowMs - snapshot.lastUpdatedAt) / 1000);
  if (elapsedSeconds <= 0) return snapshot;

  let phase = snapshot.phase;
  let secondsLeft = snapshot.secondsLeft;
  let completedPomodoros = snapshot.completedPomodoros;

  while (elapsedSeconds > 0) {
    if (secondsLeft > elapsedSeconds) {
      secondsLeft -= elapsedSeconds;
      elapsedSeconds = 0;
      continue;
    }

    elapsedSeconds -= secondsLeft;

    if (phase === 'focus') {
      completedPomodoros += 1;
      phase = 'break';
      secondsLeft = POMODORO_BREAK_SECONDS;
    } else {
      phase = 'focus';
      secondsLeft = POMODORO_FOCUS_SECONDS;
    }
  }

  return {
    phase,
    secondsLeft,
    isRunning: snapshot.isRunning,
    completedPomodoros,
    lastUpdatedAt: nowMs,
  };
}

export function loadStoredPomodoroSnapshot(nowMs: number): PomodoroSnapshot | null {
  if (typeof window === 'undefined') return null;

  const raw = readText(POMODORO_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PomodoroSnapshot;
    const hasValidPhase = parsed.phase === 'focus' || parsed.phase === 'break';
    const hasValidNumbers =
      Number.isFinite(parsed.secondsLeft) &&
      Number.isFinite(parsed.completedPomodoros) &&
      Number.isFinite(parsed.lastUpdatedAt);

    if (!hasValidPhase || !hasValidNumbers) return null;

    return advancePomodoroSnapshot(
      {
        phase: parsed.phase,
        secondsLeft: Math.max(1, Math.floor(parsed.secondsLeft)),
        isRunning: Boolean(parsed.isRunning),
        completedPomodoros: Math.max(0, Math.floor(parsed.completedPomodoros)),
        lastUpdatedAt: Math.floor(parsed.lastUpdatedAt),
      },
      nowMs,
    );
  } catch {
    return null;
  }
}

export function loadStoredTodos(): TodoItem[] {
  if (typeof window === 'undefined') return [];

  const raw = readText(TODO_LIST_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as TodoItem[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
        text: typeof item.text === 'string' ? item.text : '',
        completed: Boolean(item.completed),
        createdAt: Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
      }))
      .filter((item) => item.text.trim().length > 0);
  } catch {
    return [];
  }
}

export function loadStoredAmbientSessionActive(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = readText(AMBIENT_SESSION_ACTIVE_STORAGE_KEY);
  if (raw === null) return false;
  return raw === '1' || raw === 'true';
}

export function loadStoredAmbientSessionOwnerTab(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = readText(AMBIENT_SESSION_OWNER_TAB_STORAGE_KEY);
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function loadStoredAmbientMasterVolume(): number {
  if (typeof window === 'undefined') return 70;
  const raw = readText(AMBIENT_MASTER_VOLUME_STORAGE_KEY);
  if (raw === null) return 70;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 70;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function loadStoredLofiMusicVolume(): number {
  if (typeof window === 'undefined') return 0.85;
  const raw = readText(LOFI_MUSIC_VOLUME_STORAGE_KEY);
  if (raw === null) return 0.85;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0.85;
  return Math.max(0, Math.min(1, n));
}

export function parseAmbientEnabledJson(raw: string | null): AmbientMixerEnabled | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AmbientMixerEnabled>;
    return {
      rain: typeof parsed.rain === 'boolean' ? parsed.rain : true,
      cafe: typeof parsed.cafe === 'boolean' ? parsed.cafe : true,
      lofi: typeof parsed.lofi === 'boolean' ? parsed.lofi : true,
      wind: typeof parsed.wind === 'boolean' ? parsed.wind : false,
      fireplace: typeof parsed.fireplace === 'boolean' ? parsed.fireplace : false,
      forest: typeof parsed.forest === 'boolean' ? parsed.forest : false,
      thunder: typeof parsed.thunder === 'boolean' ? parsed.thunder : false,
      birds: typeof parsed.birds === 'boolean' ? parsed.birds : false,
      whiteNoise: typeof parsed.whiteNoise === 'boolean' ? parsed.whiteNoise : false,
    };
  } catch {
    return null;
  }
}

export function loadStoredAmbientEnabled(): AmbientMixerEnabled {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_AMBIENT_ENABLED };
  }

  const raw = readText(AMBIENT_MIXER_ENABLED_STORAGE_KEY);
  if (!raw) {
    return { ...DEFAULT_AMBIENT_ENABLED };
  }

  const parsed = parseAmbientEnabledJson(raw);
  return parsed ?? { ...DEFAULT_AMBIENT_ENABLED };
}

export function loadStoredCardPositions(): Record<CardId, Position> {
  if (typeof window === 'undefined') return { ...defaultCardPositions };

  const raw = readText(CARD_POSITIONS_STORAGE_KEY);
  if (!raw) return { ...defaultCardPositions };

  const merged: Record<CardId, Position> = { ...defaultCardPositions };
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    (Object.keys(merged) as CardId[]).forEach((id) => {
      const v = parsed[id];
      if (v && typeof v === 'object' && v !== null && !Array.isArray(v)) {
        merged[id] = sanitizePosition(v as Partial<Position>);
      }
    });
  } catch {
    return { ...defaultCardPositions };
  }

  try {
    const prev = JSON.parse(raw) as unknown;
    if (JSON.stringify(prev) !== JSON.stringify(merged)) {
      writeJson(CARD_POSITIONS_STORAGE_KEY, merged);
    }
  } catch {
    writeJson(CARD_POSITIONS_STORAGE_KEY, merged);
  }

  return merged;
}

export function loadStoredCardVisibility(storageKey: string, defaults: Record<CardId, boolean>): Record<CardId, boolean> {
  if (typeof window === 'undefined') return defaults;

  const raw = readText(storageKey);
  if (!raw) return defaults;

  try {
    const parsed = JSON.parse(raw) as Partial<Record<CardId, boolean>>;
    return {
      timer: typeof parsed.timer === 'boolean' ? parsed.timer : defaults.timer,
      countdown: typeof parsed.countdown === 'boolean' ? parsed.countdown : defaults.countdown,
      todos: typeof parsed.todos === 'boolean' ? parsed.todos : defaults.todos,
      audio: typeof parsed.audio === 'boolean' ? parsed.audio : defaults.audio,
      music: typeof parsed.music === 'boolean' ? parsed.music : defaults.music,
      note: typeof parsed.note === 'boolean' ? parsed.note : defaults.note,
      bookmarks: typeof parsed.bookmarks === 'boolean' ? parsed.bookmarks : defaults.bookmarks,
    };
  } catch {
    return defaults;
  }
}
