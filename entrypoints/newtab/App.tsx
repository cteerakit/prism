import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  AudioWaveform,
  Bookmark,
  Bird,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CloudLightning,
  CloudRain,
  Coffee,
  Flame,
  Headphones,
  ImagePlus,
  ListTodo,
  Maximize2,
  Minimize2,
  Music2,
  NotebookPen,
  Play,
  Square,
  Settings2,
  Sparkles,
  Timer,
  Trees,
  Trash2,
  Wind,
  X,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { chromeGlassRadiusBar, chromeGlassRadiusSettings, chromeGlassSurfaceClasses } from './chromeGlass';
import { BookmarkBar } from './components/BookmarkBar';
import { GlassCard } from './components/GlassCard';

type Position = {
  x: number;
  y: number;
};
type CardContextMenuState = {
  cardId: CardId;
  x: number;
  y: number;
};

type CardId = 'timer' | 'countdown' | 'todos' | 'audio' | 'music' | 'note' | 'bookmarks';
type PreferenceId =
  | 'showBackgroundDimmer'
  | 'showBackgroundBlur'
  | 'showCenterTime'
  | 'showCenterDate'
  | 'use24HourTime'
  | 'showBookmarkBar';
type BackgroundId =
  | 'ios-blue'
  | 'ios-purple'
  | 'ios-indigo'
  | 'ios-sunrise'
  | 'ios-midnight'
  | 'ios-light'
  | 'custom';
type CustomWallpaperMeta = {
  url: string;
};
type ThemeId = 'cyan' | 'violet' | 'emerald' | 'rose' | 'amber';
type ThemeOption = {
  id: ThemeId;
  name: string;
  accent: string;
  accentSoftBg: string;
  accentSoftBorder: string;
  accentText: string;
};
type PomodoroPhase = 'focus' | 'break';
type PomodoroSnapshot = {
  phase: PomodoroPhase;
  secondsLeft: number;
  isRunning: boolean;
  completedPomodoros: number;
  lastUpdatedAt: number;
};
type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};
type AmbientChannelId = 'rain' | 'cafe' | 'lofi' | 'wind' | 'fireplace' | 'forest' | 'thunder' | 'birds' | 'whiteNoise';
type AmbientMixerEnabled = Record<AmbientChannelId, boolean>;

const CARD_POSITIONS_STORAGE_KEY = 'newtab-card-positions';
const VISIBLE_CARDS_STORAGE_KEY = 'newtab-visible-cards';
const VISIBLE_DOCK_ITEMS_STORAGE_KEY = 'newtab-visible-dock-items';
const SELECTED_BACKGROUND_STORAGE_KEY = 'newtab-selected-background';
const SELECTED_THEME_STORAGE_KEY = 'newtab-selected-theme';
const POMODORO_STORAGE_KEY = 'newtab-pomodoro-state';
const QUICK_NOTE_STORAGE_KEY = 'newtab-quick-note';
const TODO_LIST_STORAGE_KEY = 'newtab-todo-list';
const COUNTDOWN_TARGET_STORAGE_KEY = 'newtab-countdown-target';
const AMBIENT_MIXER_ENABLED_STORAGE_KEY = 'newtab-ambient-mixer-enabled';
const PREFERENCES_STORAGE_KEY = 'newtab-preferences';
const CLOCK_SIZE_STORAGE_KEY = 'newtab-clock-size';
const CLOCK_POSITION_STORAGE_KEY = 'newtab-clock-position';

type ClockSize = 'small' | 'medium' | 'large';
type ClockPosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

const CLOCK_POSITIONS: ClockPosition[] = [
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

const CLOCK_POSITION_LABELS: Record<ClockPosition, string> = {
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
const CUSTOM_WALLPAPER_META_STORAGE_KEY = 'newtab-custom-wallpaper-meta';

function loadCustomWallpaperFromStorage(): CustomWallpaperMeta | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(CUSTOM_WALLPAPER_META_STORAGE_KEY);
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

function defaultPreferences(): Record<PreferenceId, boolean> {
  return {
    showBackgroundDimmer: true,
    showBackgroundBlur: false,
    showCenterTime: true,
    showCenterDate: true,
    use24HourTime: false,
    showBookmarkBar: false,
  };
}

function loadStoredPreferences(): Record<PreferenceId, boolean> {
  const defaults = defaultPreferences();
  if (typeof window === 'undefined') return defaults;
  const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
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

function loadStoredClockSize(): ClockSize {
  if (typeof window === 'undefined') return 'large';
  const raw = window.localStorage.getItem(CLOCK_SIZE_STORAGE_KEY);
  if (raw === 'small' || raw === 'medium' || raw === 'large') return raw;
  return 'large';
}

function loadStoredClockPosition(): ClockPosition {
  if (typeof window === 'undefined') return 'center';
  const raw = window.localStorage.getItem(CLOCK_POSITION_STORAGE_KEY);
  return CLOCK_POSITIONS.includes(raw as ClockPosition) ? (raw as ClockPosition) : 'center';
}

function isoToDatetimeLocalValue(iso: string): string {
  if (!iso.trim()) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const AMBIENT_SESSION_ACTIVE_STORAGE_KEY = 'newtab-ambient-session-active';
const AMBIENT_SESSION_OWNER_TAB_STORAGE_KEY = 'newtab-ambient-session-owner-tab';
const AMBIENT_MASTER_VOLUME_STORAGE_KEY = 'newtab-ambient-master-volume';
const AMBIENT_AUDIO_BROADCAST_CHANNEL = 'prism-ambient-audio';
const LOFI_MUSIC_VOLUME_STORAGE_KEY = 'newtab-lofi-music-volume';

type AmbientAudioBroadcastMessage =
  | { type: 'stop-engine'; tabId: string }
  | { type: 'ambient-master-volume'; tabId: string; value: number }
  | { type: 'music-volume'; tabId: string; value: number };
/** Fixed loudness when a channel is on (no per-channel sliders). */
const AMBIENT_CHANNEL_LEVEL = 0.72;
const ambientChannelMeta: Array<{ id: AmbientChannelId; label: string; description: string; Icon: LucideIcon }> = [
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
const themeOptions: ThemeOption[] = [
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

const backgroundOptions: Array<{ id: BackgroundId; name: string; imageUrl: string }> = [
  {
    id: 'ios-blue',
    name: 'iOS Blue',
    imageUrl: makeGradientWallpaper(['#38bdf8', '#1d4ed8', '#0f172a']),
  },
  {
    id: 'ios-purple',
    name: 'iOS Purple',
    imageUrl: makeGradientWallpaper(['#c084fc', '#7c3aed', '#312e81']),
  },
  {
    id: 'ios-indigo',
    name: 'iOS Indigo',
    imageUrl: makeGradientWallpaper(['#818cf8', '#4f46e5', '#1f2937']),
  },
  {
    id: 'ios-sunrise',
    name: 'iOS Sunrise',
    imageUrl: makeGradientWallpaper(['#fb7185', '#f59e0b', '#f8fafc']),
  },
  {
    id: 'ios-midnight',
    name: 'iOS Midnight',
    imageUrl: makeGradientWallpaper(['#0f172a', '#1e293b', '#0b1120']),
  },
  {
    id: 'ios-light',
    name: 'iOS Light',
    imageUrl: makeGradientWallpaper(['#f8fafc', '#e2e8f0', '#cbd5e1']),
  },
];

const defaultCardPositions: Record<CardId, Position> = {
  timer: { x: 0, y: 0 },
  countdown: { x: 0, y: 0 },
  todos: { x: 0, y: 0 },
  audio: { x: 0, y: 0 },
  music: { x: 0, y: 0 },
  note: { x: 0, y: 0 },
  bookmarks: { x: 0, y: 0 },
};

/** Bounds for persisted drag offsets (prevents corrupt / unbounded values from hiding widgets). */
const MAX_STORED_DRAG_OFFSET = 6000;

function sanitizePosition(p: Partial<Position> | undefined): Position {
  const x = typeof p?.x === 'number' && Number.isFinite(p.x) ? p.x : 0;
  const y = typeof p?.y === 'number' && Number.isFinite(p.y) ? p.y : 0;
  return {
    x: Math.max(-MAX_STORED_DRAG_OFFSET, Math.min(MAX_STORED_DRAG_OFFSET, x)),
    y: Math.max(-MAX_STORED_DRAG_OFFSET, Math.min(MAX_STORED_DRAG_OFFSET, y)),
  };
}

function loadStoredCardPositions(): Record<CardId, Position> {
  if (typeof window === 'undefined') return { ...defaultCardPositions };

  const raw = window.localStorage.getItem(CARD_POSITIONS_STORAGE_KEY);
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
      window.localStorage.setItem(CARD_POSITIONS_STORAGE_KEY, JSON.stringify(merged));
    }
  } catch {
    window.localStorage.setItem(CARD_POSITIONS_STORAGE_KEY, JSON.stringify(merged));
  }

  return merged;
}

const defaultCardVisibility: Record<CardId, boolean> = {
  timer: false,
  countdown: false,
  todos: false,
  audio: false,
  music: false,
  note: false,
  bookmarks: false,
};
const defaultDockItemVisibility: Record<CardId, boolean> = {
  timer: true,
  countdown: true,
  todos: true,
  audio: true,
  music: true,
  note: true,
  bookmarks: true,
};

const POMODORO_FOCUS_SECONDS = 25 * 60;
const POMODORO_BREAK_SECONDS = 5 * 60;

function getPomodoroDuration(phase: PomodoroPhase) {
  return phase === 'focus' ? POMODORO_FOCUS_SECONDS : POMODORO_BREAK_SECONDS;
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

function loadStoredPomodoroSnapshot(nowMs: number): PomodoroSnapshot | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(POMODORO_STORAGE_KEY);
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

function loadStoredTodos(): TodoItem[] {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(TODO_LIST_STORAGE_KEY);
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

function loadStoredAmbientSessionActive(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = window.localStorage.getItem(AMBIENT_SESSION_ACTIVE_STORAGE_KEY);
  if (raw === null) return false;
  return raw === '1' || raw === 'true';
}

function loadStoredAmbientSessionOwnerTab(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(AMBIENT_SESSION_OWNER_TAB_STORAGE_KEY);
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function loadStoredAmbientMasterVolume(): number {
  if (typeof window === 'undefined') return 70;
  const raw = window.localStorage.getItem(AMBIENT_MASTER_VOLUME_STORAGE_KEY);
  if (raw === null) return 70;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 70;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function loadStoredLofiMusicVolume(): number {
  if (typeof window === 'undefined') return 0.85;
  const raw = window.localStorage.getItem(LOFI_MUSIC_VOLUME_STORAGE_KEY);
  if (raw === null) return 0.85;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0.85;
  return Math.max(0, Math.min(1, n));
}

function parseAmbientEnabledJson(raw: string | null): AmbientMixerEnabled | null {
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

function loadStoredAmbientEnabled(): AmbientMixerEnabled {
  if (typeof window === 'undefined') {
    return { rain: true, cafe: true, lofi: true, wind: false, fireplace: false, forest: false, thunder: false, birds: false, whiteNoise: false };
  }

  const raw = window.localStorage.getItem(AMBIENT_MIXER_ENABLED_STORAGE_KEY);
  if (!raw) {
    return { rain: true, cafe: true, lofi: true, wind: false, fireplace: false, forest: false, thunder: false, birds: false, whiteNoise: false };
  }

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
    return { rain: true, cafe: true, lofi: true, wind: false, fireplace: false, forest: false, thunder: false, birds: false, whiteNoise: false };
  }
}

function loadStoredCardVisibility(storageKey: string, defaults: Record<CardId, boolean>): Record<CardId, boolean> {
  if (typeof window === 'undefined') return defaults;

  const raw = window.localStorage.getItem(storageKey);
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

function SettingToggle({
  label,
  description,
  enabled,
  onChange,
  theme,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
  theme: ThemeOption;
}) {
  const [tipPos, setTipPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <button
      type="button"
      onClick={onChange}
      onMouseEnter={(event) => setTipPos({ x: event.clientX, y: event.clientY })}
      onMouseMove={(event) => setTipPos({ x: event.clientX, y: event.clientY })}
      onMouseLeave={() => setTipPos(null)}
      className="relative flex w-full items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/10 p-3 text-left transition hover:bg-white/15"
      aria-pressed={enabled}
    >
      {tipPos
        ? createPortal(
            <span
              className="pointer-events-none fixed z-[100] max-w-[min(18rem,calc(100vw-1.5rem))] rounded-md border border-white/25 bg-black/90 px-2.5 py-1.5 text-left text-[11px] leading-snug text-slate-100 shadow-lg"
              style={{
                left: tipPos.x + 12,
                top: tipPos.y + 12,
              }}
              role="tooltip"
            >
              {description}
            </span>,
            document.body,
          )
        : null}
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-100">{label}</p>
      </div>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition ${
          enabled ? '' : 'border-white/30 bg-white/10'
        }`}
        style={enabled ? { borderColor: theme.accentSoftBorder, backgroundColor: theme.accent } : undefined}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}

function LofiMusicCard({ theme }: { theme: ThemeOption }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicTabIdRef = useRef(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `tab-${Math.random().toString(36).slice(2)}`,
  );
  const musicVolumeBroadcastRef = useRef<BroadcastChannel | null>(null);
  const streamOptions = useMemo(
    () => [
      { id: 'groove-salad-1', name: 'Groove Salad', streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3' },
      { id: 'groove-salad-2', name: 'Groove Salad Mirror', streamUrl: 'https://ice2.somafm.com/groovesalad-128-mp3' },
    ],
    [],
  );
  const [stationIndex, setStationIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [volume, setVolume] = useState(() => loadStoredLofiMusicVolume());
  const activeStation = streamOptions[stationIndex] ?? streamOptions[0];

  useEffect(() => {
    const bc = new BroadcastChannel(AMBIENT_AUDIO_BROADCAST_CHANNEL);
    musicVolumeBroadcastRef.current = bc;
    const tabId = musicTabIdRef.current;
    bc.onmessage = (event: MessageEvent<AmbientAudioBroadcastMessage>) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type !== 'music-volume') return;
      if (data.tabId === tabId) return;
      const n = Number(data.value);
      if (!Number.isFinite(n)) return;
      const next = Math.max(0, Math.min(1, n));
      setVolume(next);
      if (audioRef.current) audioRef.current.volume = next;
    };
    return () => {
      bc.close();
      if (musicVolumeBroadcastRef.current === bc) {
        musicVolumeBroadcastRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== LOFI_MUSIC_VOLUME_STORAGE_KEY || event.newValue == null) return;
      const n = Number(event.newValue);
      if (!Number.isFinite(n)) return;
      const next = Math.max(0, Math.min(1, n));
      setVolume(next);
      if (audioRef.current) audioRef.current.volume = next;
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LOFI_MUSIC_VOLUME_STORAGE_KEY, String(volume));
    musicVolumeBroadcastRef.current?.postMessage({
      type: 'music-volume',
      tabId: musicTabIdRef.current,
      value: volume,
    } satisfies AmbientAudioBroadcastMessage);
  }, [volume]);

  useEffect(() => {
    return () => {
      if (!audioRef.current) return;
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    };
  }, []);

  const stopAudio = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.src = '';
    audioRef.current = null;
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const handlePlay = useCallback(async () => {
    setHasError(false);
    setErrorMessage(null);
    setIsLoading(true);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    const audio = new Audio(activeStation.streamUrl);
    audio.preload = 'none';
    audio.volume = volume;

    audio.addEventListener('playing', () => {
      setIsPlaying(true);
      setIsLoading(false);
    });
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('waiting', () => setIsLoading(true));
    audio.addEventListener('stalled', () => setIsLoading(true));
    audio.addEventListener('error', () => {
      setHasError(true);
      setErrorMessage('Could not load stream. Try Retry or Switch Station.');
      setIsPlaying(false);
      setIsLoading(false);
    });

    audioRef.current = audio;
    try {
      await audio.play();
    } catch {
      setHasError(true);
      setErrorMessage('Browser blocked autoplay. Press Play again.');
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, [activeStation.streamUrl, volume]);

  const handlePause = useCallback(() => stopAudio(), [stopAudio]);

  const handleRetry = useCallback(() => {
    void handlePlay();
  }, [handlePlay]);

  const handleSwitchStation = useCallback(() => {
    const next = (stationIndex + 1) % streamOptions.length;
    setStationIndex(next);
    setHasError(false);
    setErrorMessage(null);
    stopAudio();
  }, [stationIndex, streamOptions.length, stopAudio]);

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-700/90 dark:text-slate-200/80">
        Station: <span className="font-medium">{activeStation.name}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {!isPlaying ? (
          <button
            type="button"
            onClick={handlePlay}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition"
            style={{
              borderColor: theme.accentSoftBorder,
              backgroundColor: theme.accentSoftBg,
              color: theme.accentText,
            }}
          >
            <Play className="h-3.5 w-3.5" />
            Play
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePause}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:bg-white/20 dark:text-slate-100"
          >
            <Square className="h-3.5 w-3.5" />
            Stop
          </button>
        )}
        <button
          type="button"
          onClick={handleSwitchStation}
          className="rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:bg-white/20 dark:text-slate-100"
        >
          Switch Station
        </button>
        {hasError || errorMessage ? (
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:bg-white/20 dark:text-slate-100"
          >
            Retry
          </button>
        ) : null}
      </div>
      <p className="text-[11px] text-slate-700/90 dark:text-slate-200/80">
        {hasError || errorMessage
          ? errorMessage ?? 'Playback failed. Try Retry or Switch Station.'
          : isLoading
            ? 'Connecting to stream...'
            : isPlaying
              ? 'Now playing.'
              : 'Press Play to start.'}
      </p>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(event) => {
          const next = Number(event.target.value);
          setVolume(next);
          if (audioRef.current) audioRef.current.volume = next;
        }}
        className="w-full"
        style={{ accentColor: theme.accent }}
        aria-label="Radio volume"
      />
    </div>
  );
}

const QUICK_NOTE_MIN_HEIGHT_PX = 96;

function QuickNoteTextarea({
  value,
  onChange,
  theme,
}: {
  value: string;
  onChange: (next: string) => void;
  theme: ThemeOption;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    const maxPx = Math.min(Math.floor(window.innerHeight * 0.65), 28 * 16);
    const natural = el.scrollHeight;
    const h = Math.min(Math.max(natural, QUICK_NOTE_MIN_HEIGHT_PX), maxPx);
    el.style.height = `${h}px`;
    el.style.overflowY = natural > maxPx ? 'auto' : 'hidden';
  }, [value]);

  return (
    <textarea
      ref={ref}
      id="quick-note"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Write your quick note..."
      className="w-full resize-none rounded-xl border border-white/25 bg-white/15 p-3 text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-700/60 focus:ring-2 dark:bg-black/20 dark:text-slate-100 dark:placeholder:text-slate-300/55"
      style={
        {
          '--tw-ring-color': theme.accentSoftBg,
          borderColor: 'rgba(255,255,255,0.25)',
        } as CSSProperties
      }
    />
  );
}

function LiquidGlassFilterDefs() {
  return (
    <svg aria-hidden className="pointer-events-none absolute h-0 w-0">
      <defs>
        <filter id="liquid-glass" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.022" numOctaves={2} seed={7} result="liquid-noise" />
          <feGaussianBlur in="liquid-noise" stdDeviation={1.1} result="liquid-noise-soft" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="liquid-noise-soft"
            scale={18}
            xChannelSelector="R"
            yChannelSelector="G"
            result="liquid-refract"
          />
          <feGaussianBlur in="SourceAlpha" stdDeviation={2.2} result="liquid-alpha" />
          <feSpecularLighting
            in="liquid-alpha"
            surfaceScale={3}
            specularConstant={0.5}
            specularExponent={24}
            lightingColor="#ffffff"
            result="liquid-specular"
          >
            <fePointLight x={-120} y={-140} z={220} />
          </feSpecularLighting>
          <feComposite in="liquid-specular" in2="SourceAlpha" operator="in" result="liquid-specular-clipped" />
          <feBlend in="liquid-refract" in2="liquid-specular-clipped" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
}

export default function App() {
  const dragBoundaryRef = useRef<HTMLDivElement>(null);
  /** Last-touched order for z-stacking; each card only moves in this list when *it* is activated. */
  const [cardTouchOrder, setCardTouchOrder] = useState<CardId[]>([]);
  const initialPomodoroSnapshot = useMemo(() => loadStoredPomodoroSnapshot(Date.now()), []);
  const [isDockVisible, setIsDockVisible] = useState(false);
  const [isDockHovered, setIsDockHovered] = useState(false);
  /** Half-width of the dock in px; kept in sync with the real aside size for bottom-edge reveal. */
  const dockRevealHalfWidthRef = useRef(448);
  const dockAsideRef = useRef<HTMLElement | null>(null);
  const dockScrollRowRef = useRef<HTMLDivElement>(null);
  const [dockCanScrollLeft, setDockCanScrollLeft] = useState(false);
  const [dockCanScrollRight, setDockCanScrollRight] = useState(false);
  const [dockHasHorizontalOverflow, setDockHasHorizontalOverflow] = useState(false);
  const [dockIsGrabDragging, setDockIsGrabDragging] = useState(false);
  const dockGrabPointerId = useRef<number | undefined>(undefined);
  const dockGrabStartX = useRef(0);
  const dockGrabStartScrollLeft = useRef(0);
  const dockGrabDragActive = useRef(false);
  const dockSuppressNextClick = useRef(false);

  const updateDockScrollOverflow = useCallback(() => {
    const el = dockScrollRowRef.current;
    if (!el) {
      setDockCanScrollLeft(false);
      setDockCanScrollRight(false);
      setDockHasHorizontalOverflow(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const endGap = 2;
    setDockCanScrollLeft(scrollLeft > endGap);
    setDockCanScrollRight(scrollLeft + clientWidth < scrollWidth - endGap);
    setDockHasHorizontalOverflow(scrollWidth > clientWidth + endGap);
  }, []);

  const onDockScrollRowPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const el = dockScrollRowRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    dockGrabPointerId.current = e.pointerId;
    dockGrabStartX.current = e.clientX;
    dockGrabStartScrollLeft.current = el.scrollLeft;
    dockGrabDragActive.current = false;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const onDockScrollRowPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dockGrabPointerId.current !== e.pointerId) return;
    const el = dockScrollRowRef.current;
    if (!el) return;
    const dx = e.clientX - dockGrabStartX.current;
    if (!dockGrabDragActive.current) {
      if (Math.abs(dx) < 6) return;
      dockGrabDragActive.current = true;
      setDockIsGrabDragging(true);
    }
    el.scrollLeft = dockGrabStartScrollLeft.current - dx;
    e.preventDefault();
  }, []);

  const endDockScrollRowGrab = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dockGrabPointerId.current !== e.pointerId) return;
    const el = dockScrollRowRef.current;
    const didDrag = dockGrabDragActive.current;
    dockGrabPointerId.current = undefined;
    dockGrabDragActive.current = false;
    setDockIsGrabDragging(false);
    if (el) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    if (didDrag) {
      dockSuppressNextClick.current = true;
    }
  }, []);

  const onDockScrollRowClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dockSuppressNextClick.current) return;
    e.preventDefault();
    e.stopPropagation();
    dockSuppressNextClick.current = false;
  }, []);

  const dockScrollFadeMask = useMemo((): CSSProperties | undefined => {
    if (!dockCanScrollLeft && !dockCanScrollRight) return undefined;
    const w = '2.75rem';
    let gradient: string;
    if (dockCanScrollLeft && dockCanScrollRight) {
      gradient = `linear-gradient(to right, transparent 0%, black ${w}, black calc(100% - ${w}), transparent 100%)`;
    } else if (dockCanScrollLeft) {
      gradient = `linear-gradient(to right, transparent 0%, black ${w})`;
    } else {
      gradient = `linear-gradient(to right, black calc(100% - ${w}), transparent 100%)`;
    }
    return {
      WebkitMaskImage: gradient,
      maskImage: gradient,
    };
  }, [dockCanScrollLeft, dockCanScrollRight]);

  const [isFullscreen, setIsFullscreen] = useState(() =>
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false,
  );
  const [visibleCards, setVisibleCards] = useState<Record<CardId, boolean>>(() =>
    loadStoredCardVisibility(VISIBLE_CARDS_STORAGE_KEY, defaultCardVisibility),
  );
  const [visibleDockItems, setVisibleDockItems] = useState<Record<CardId, boolean>>(() =>
    loadStoredCardVisibility(VISIBLE_DOCK_ITEMS_STORAGE_KEY, defaultDockItemVisibility),
  );
  const [cardContextMenu, setCardContextMenu] = useState<CardContextMenuState | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<Record<PreferenceId, boolean>>(() => loadStoredPreferences());
  const [clockSize, setClockSize] = useState<ClockSize>(() => loadStoredClockSize());
  const [clockPosition, setClockPosition] = useState<ClockPosition>(() => loadStoredClockPosition());
  const [now, setNow] = useState(() => new Date());
  const [selectedBackground, setSelectedBackground] = useState<BackgroundId>(() => {
    if (typeof window === 'undefined') return 'ios-blue';
    const raw = window.localStorage.getItem(SELECTED_BACKGROUND_STORAGE_KEY);
    if (!raw) return 'ios-blue';
    if (raw === 'custom') {
      return loadCustomWallpaperFromStorage() ? 'custom' : 'ios-blue';
    }
    return backgroundOptions.some((option) => option.id === raw) ? (raw as BackgroundId) : 'ios-blue';
  });
  const [customWallpaper, setCustomWallpaper] = useState<CustomWallpaperMeta | null>(() =>
    loadCustomWallpaperFromStorage(),
  );
  const [customWallpaperError, setCustomWallpaperError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(() => {
    if (typeof window === 'undefined') return 'cyan';
    const raw = window.localStorage.getItem(SELECTED_THEME_STORAGE_KEY);
    if (!raw) return 'cyan';
    return themeOptions.some((option) => option.id === raw) ? (raw as ThemeId) : 'cyan';
  });
  const [cardPositions, setCardPositions] = useState<Record<CardId, Position>>(loadStoredCardPositions);
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>(initialPomodoroSnapshot?.phase ?? 'focus');
  const [pomodoroSecondsLeft, setPomodoroSecondsLeft] = useState(
    initialPomodoroSnapshot?.secondsLeft ?? POMODORO_FOCUS_SECONDS,
  );
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(initialPomodoroSnapshot?.isRunning ?? false);
  const [completedPomodoros, setCompletedPomodoros] = useState(initialPomodoroSnapshot?.completedPomodoros ?? 0);
  const [quickNote, setQuickNote] = useState(() => {
    if (typeof window === 'undefined') return 'Capture a thought, reminder, or idea here.';
    return window.localStorage.getItem(QUICK_NOTE_STORAGE_KEY) ?? 'Capture a thought, reminder, or idea here.';
  });
  const [todoItems, setTodoItems] = useState<TodoItem[]>(() => loadStoredTodos());
  const [newTodoText, setNewTodoText] = useState('');
  const [countdownTargetIso, setCountdownTargetIso] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(COUNTDOWN_TARGET_STORAGE_KEY) ?? '';
  });
  const [ambientEnabled, setAmbientEnabled] = useState<AmbientMixerEnabled>(() => loadStoredAmbientEnabled());
  const [ambientMasterVolume, setAmbientMasterVolume] = useState(() => loadStoredAmbientMasterVolume());
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(() => loadStoredAmbientSessionActive());
  const [ambientOwnerTabId, setAmbientOwnerTabId] = useState<string | null>(() => loadStoredAmbientSessionOwnerTab());
  const ambientEnabledRef = useRef(ambientEnabled);
  const ambientMasterVolumeRef = useRef(ambientMasterVolume);
  const ambientTabIdRef = useRef(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `tab-${Math.random().toString(36).slice(2)}`,
  );
  const ambientBroadcastRef = useRef<BroadcastChannel | null>(null);
  const suppressAmbientVolumeSyncRef = useRef(false);
  const customWallpaperFileInputRef = useRef<HTMLInputElement | null>(null);
  const cardContextMenuRef = useRef<HTMLDivElement | null>(null);
  const stopAmbientAudioRef = useRef<() => void>(() => {});
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const rainGainRef = useRef<GainNode | null>(null);
  const cafeGainRef = useRef<GainNode | null>(null);
  const lofiGainRef = useRef<GainNode | null>(null);
  const windGainRef = useRef<GainNode | null>(null);
  const fireplaceGainRef = useRef<GainNode | null>(null);
  const forestGainRef = useRef<GainNode | null>(null);
  const thunderGainRef = useRef<GainNode | null>(null);
  const birdsGainRef = useRef<GainNode | null>(null);
  const whiteNoiseGainRef = useRef<GainNode | null>(null);
  const ambientIntervalRef = useRef<number | null>(null);
  const activeTheme = themeOptions.find((option) => option.id === selectedTheme) ?? themeOptions[0];

  const applyAmbientMasterVolume = useCallback((rawValue: unknown, fromRemote: boolean) => {
    const n = Number(rawValue);
    if (!Number.isFinite(n)) return;
    const next = Math.max(0, Math.min(100, Math.round(n)));
    setAmbientMasterVolume((prev) => {
      if (prev === next) return prev;
      suppressAmbientVolumeSyncRef.current = fromRemote;
      return next;
    });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    window.localStorage.setItem(CLOCK_SIZE_STORAGE_KEY, clockSize);
  }, [clockSize]);

  useEffect(() => {
    window.localStorage.setItem(CLOCK_POSITION_STORAGE_KEY, clockPosition);
  }, [clockPosition]);

  useEffect(() => {
    if (customWallpaper) {
      window.localStorage.setItem(CUSTOM_WALLPAPER_META_STORAGE_KEY, JSON.stringify(customWallpaper));
    } else {
      window.localStorage.removeItem(CUSTOM_WALLPAPER_META_STORAGE_KEY);
    }
  }, [customWallpaper]);

  const pomodoroTotalSeconds = pomodoroPhase === 'focus' ? POMODORO_FOCUS_SECONDS : POMODORO_BREAK_SECONDS;
  const pomodoroProgress = ((pomodoroTotalSeconds - pomodoroSecondsLeft) / pomodoroTotalSeconds) * 100;
  const pomodoroMinutes = Math.floor(pomodoroSecondsLeft / 60);
  const pomodoroSeconds = pomodoroSecondsLeft % 60;
  const formattedPomodoroTime = `${String(pomodoroMinutes).padStart(2, '0')}:${String(pomodoroSeconds).padStart(2, '0')}`;
  const pomodoroStatusLabel = pomodoroPhase === 'focus' ? 'Focus Session' : 'Break Session';

  const resetPomodoro = (phase: PomodoroPhase = 'focus') => {
    setIsPomodoroRunning(false);
    setPomodoroPhase(phase);
    setPomodoroSecondsLeft(getPomodoroDuration(phase));
  };

  useEffect(() => {
    const snapshot: PomodoroSnapshot = {
      phase: pomodoroPhase,
      secondsLeft: pomodoroSecondsLeft,
      isRunning: isPomodoroRunning,
      completedPomodoros,
      lastUpdatedAt: Date.now(),
    };

    window.localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(snapshot));
  }, [completedPomodoros, isPomodoroRunning, pomodoroPhase, pomodoroSecondsLeft]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== POMODORO_STORAGE_KEY || !event.newValue) return;

      const syncedSnapshot = loadStoredPomodoroSnapshot(Date.now());
      if (!syncedSnapshot) return;

      setPomodoroPhase(syncedSnapshot.phase);
      setPomodoroSecondsLeft(syncedSnapshot.secondsLeft);
      setIsPomodoroRunning(syncedSnapshot.isRunning);
      setCompletedPomodoros(syncedSnapshot.completedPomodoros);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!isPomodoroRunning) return;

    const timerId = window.setInterval(() => {
      setPomodoroSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        if (pomodoroPhase === 'focus') {
          setCompletedPomodoros((count) => count + 1);
          setPomodoroPhase('break');
          return POMODORO_BREAK_SECONDS;
        }

        setPomodoroPhase('focus');
        return POMODORO_FOCUS_SECONDS;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isPomodoroRunning, pomodoroPhase]);

  const countdownTargetMs = useMemo(() => {
    if (!countdownTargetIso.trim()) return null;
    const t = Date.parse(countdownTargetIso);
    return Number.isFinite(t) ? t : null;
  }, [countdownTargetIso]);

  const countdownParts = useMemo(() => {
    if (countdownTargetMs === null) return null;
    const diff = countdownTargetMs - now.getTime();
    if (diff <= 0) {
      return { expired: true as const };
    }
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { expired: false as const, days, hours, minutes, seconds };
  }, [countdownTargetMs, now]);

  const timerCardContent = (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-end justify-between gap-2">
          <p className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{formattedPomodoroTime}</p>
          <span className="rounded-full border border-white/35 bg-white/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100">
            {pomodoroStatusLabel}
          </span>
        </div>
      </div>

      <div>
        <div className="h-2 overflow-hidden rounded-full bg-black/15 dark:bg-white/15">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${Math.max(0, Math.min(100, pomodoroProgress))}%`,
              backgroundColor: activeTheme.accent,
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsPomodoroRunning((prev) => !prev)}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-900 transition dark:text-slate-100"
          style={{
            borderColor: activeTheme.accentSoftBorder,
            backgroundColor: activeTheme.accentSoftBg,
          }}
        >
          {isPomodoroRunning ? 'Pause' : 'Start'}
        </button>
        <button
          type="button"
          onClick={() => resetPomodoro(pomodoroPhase)}
          className="rounded-lg border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:bg-white/25 dark:text-slate-100"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => resetPomodoro(pomodoroPhase === 'focus' ? 'break' : 'focus')}
          className="rounded-lg border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:bg-white/25 dark:text-slate-100"
        >
          Skip
        </button>
      </div>

      <p className="text-xs text-slate-700/80 dark:text-slate-200/80">Completed focus sessions: {completedPomodoros}</p>
    </div>
  );

  const countdownCardContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="countdown-datetime" className="block text-[11px] font-medium uppercase tracking-wide text-slate-700/85 dark:text-slate-200/75">
          Target date and time
        </label>
        <input
          id="countdown-datetime"
          type="datetime-local"
          value={isoToDatetimeLocalValue(countdownTargetIso)}
          onChange={(event) => {
            const v = event.target.value;
            if (!v) {
              setCountdownTargetIso('');
              return;
            }
            const d = new Date(v);
            if (!Number.isNaN(d.getTime())) setCountdownTargetIso(d.toISOString());
          }}
          className="h-9 w-full rounded-lg border border-white/30 bg-white/15 px-3 text-sm text-slate-900 outline-none focus:ring-2 dark:bg-black/20 dark:text-slate-100"
          style={{ '--tw-ring-color': activeTheme.accentSoftBg } as CSSProperties}
        />
      </div>

      {countdownParts === null ? (
        <p className="text-xs text-slate-700/85 dark:text-slate-200/75">Pick a date and time to start the countdown.</p>
      ) : countdownParts.expired ? (
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">That date has passed.</p>
      ) : (
        <div className="grid grid-cols-4 gap-2 text-center">
          {(
            [
              ['Days', countdownParts.days],
              ['Hrs', countdownParts.hours],
              ['Min', countdownParts.minutes],
              ['Sec', countdownParts.seconds],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-white/25 bg-white/10 px-1 py-2 dark:bg-black/25"
            >
              <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300/85">
                {label}
              </p>
            </div>
          ))}
        </div>
      )}

      {countdownTargetIso ? (
        <button
          type="button"
          onClick={() => setCountdownTargetIso('')}
          className="rounded-lg border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:bg-white/25 dark:text-slate-100"
        >
          Clear target
        </button>
      ) : null}
    </div>
  );

  const incompleteTodoCount = todoItems.filter((item) => !item.completed).length;
  const completedTodoCount = todoItems.length - incompleteTodoCount;

  const addTodoItem = () => {
    const text = newTodoText.trim();
    if (!text) return;

    setTodoItems((prev) => [
      {
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setNewTodoText('');
  };

  const toggleTodoItem = (id: string) => {
    setTodoItems((prev) => prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)));
  };

  const deleteTodoItem = (id: string) => {
    setTodoItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCompletedTodos = () => {
    setTodoItems((prev) => prev.filter((item) => !item.completed));
  };

  const updateMixerGains = () => {
    if (!audioContextRef.current) return;
    const nowTime = audioContextRef.current.currentTime;
    const master = ambientMasterVolumeRef.current / 100;
    const enabled = ambientEnabledRef.current;
    const on = AMBIENT_CHANNEL_LEVEL;

    if (masterGainRef.current) {
      masterGainRef.current.gain.cancelScheduledValues(nowTime);
      masterGainRef.current.gain.linearRampToValueAtTime(master, nowTime + 0.1);
    }
    if (rainGainRef.current) {
      rainGainRef.current.gain.cancelScheduledValues(nowTime);
      rainGainRef.current.gain.linearRampToValueAtTime((enabled.rain ? on : 0) * 0.42, nowTime + 0.1);
    }
    if (cafeGainRef.current) {
      cafeGainRef.current.gain.cancelScheduledValues(nowTime);
      cafeGainRef.current.gain.linearRampToValueAtTime((enabled.cafe ? on : 0) * 0.35, nowTime + 0.1);
    }
    if (lofiGainRef.current) {
      lofiGainRef.current.gain.cancelScheduledValues(nowTime);
      lofiGainRef.current.gain.linearRampToValueAtTime((enabled.lofi ? on : 0) * 0.24, nowTime + 0.1);
    }
    if (windGainRef.current) {
      windGainRef.current.gain.cancelScheduledValues(nowTime);
      windGainRef.current.gain.linearRampToValueAtTime((enabled.wind ? on : 0) * 0.26, nowTime + 0.1);
    }
    if (fireplaceGainRef.current) {
      fireplaceGainRef.current.gain.cancelScheduledValues(nowTime);
      fireplaceGainRef.current.gain.linearRampToValueAtTime((enabled.fireplace ? on : 0) * 0.28, nowTime + 0.1);
    }
    if (forestGainRef.current) {
      forestGainRef.current.gain.cancelScheduledValues(nowTime);
      forestGainRef.current.gain.linearRampToValueAtTime((enabled.forest ? on : 0) * 0.26, nowTime + 0.1);
    }
    if (thunderGainRef.current) {
      thunderGainRef.current.gain.cancelScheduledValues(nowTime);
      thunderGainRef.current.gain.linearRampToValueAtTime((enabled.thunder ? on : 0) * 0.34, nowTime + 0.1);
    }
    if (birdsGainRef.current) {
      birdsGainRef.current.gain.cancelScheduledValues(nowTime);
      birdsGainRef.current.gain.linearRampToValueAtTime((enabled.birds ? on : 0) * 0.2, nowTime + 0.1);
    }
    if (whiteNoiseGainRef.current) {
      whiteNoiseGainRef.current.gain.cancelScheduledValues(nowTime);
      whiteNoiseGainRef.current.gain.linearRampToValueAtTime((enabled.whiteNoise ? on : 0) * 0.3, nowTime + 0.1);
    }
  };

  const stopAmbientAudio = () => {
    if (ambientIntervalRef.current !== null) {
      window.clearInterval(ambientIntervalRef.current);
      ambientIntervalRef.current = null;
    }

    const context = audioContextRef.current;
    audioContextRef.current = null;
    masterGainRef.current = null;
    rainGainRef.current = null;
    cafeGainRef.current = null;
    lofiGainRef.current = null;
    windGainRef.current = null;
    fireplaceGainRef.current = null;
    forestGainRef.current = null;
    thunderGainRef.current = null;
    birdsGainRef.current = null;
    whiteNoiseGainRef.current = null;

    if (context) {
      void context.close();
    }
  };

  stopAmbientAudioRef.current = stopAmbientAudio;

  const startAmbientAudio = async () => {
    if (audioContextRef.current) {
      await audioContextRef.current.resume();
      return;
    }

    const context = new AudioContext();
    const masterGain = context.createGain();
    masterGain.gain.value = ambientMasterVolumeRef.current / 100;
    masterGain.connect(context.destination);

    const buildNoiseChannel = (filterFrequency: number, qValue: number) => {
      const bufferSize = context.sampleRate * 2;
      const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i += 1) output[i] = Math.random() * 2 - 1;

      const source = context.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFrequency;
      filter.Q.value = qValue;

      const gain = context.createGain();
      gain.gain.value = 0;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      source.start();
      return gain;
    };

    const rainGain = buildNoiseChannel(1200, 0.7);
    const cafeGain = buildNoiseChannel(650, 0.45);
    const windGain = buildNoiseChannel(220, 0.65);
    const fireplaceGain = buildNoiseChannel(1800, 1.15);
    const forestGain = buildNoiseChannel(950, 0.9);
    const thunderGain = buildNoiseChannel(110, 0.55);

    const whiteNoiseGain = context.createGain();
    whiteNoiseGain.gain.value = 0;
    const whiteNoiseSource = context.createBufferSource();
    const whiteNoiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const whiteNoiseData = whiteNoiseBuffer.getChannelData(0);
    for (let i = 0; i < whiteNoiseData.length; i += 1) whiteNoiseData[i] = Math.random() * 2 - 1;
    whiteNoiseSource.buffer = whiteNoiseBuffer;
    whiteNoiseSource.loop = true;
    whiteNoiseSource.connect(whiteNoiseGain);
    whiteNoiseGain.connect(masterGain);
    whiteNoiseSource.start();

    const lofiGain = context.createGain();
    lofiGain.gain.value = 0;
    lofiGain.connect(masterGain);

    const lofiNotes = [196, 246.94, 293.66];
    lofiNotes.forEach((frequency, index) => {
      const osc = context.createOscillator();
      const oscGain = context.createGain();
      osc.type = index === 1 ? 'sine' : 'triangle';
      osc.frequency.value = frequency;
      oscGain.gain.value = index === 1 ? 0.05 : 0.035;
      osc.connect(oscGain);
      oscGain.connect(lofiGain);
      osc.start();
    });

    const birdsGain = context.createGain();
    birdsGain.gain.value = 0;
    birdsGain.connect(masterGain);
    const birdOsc = context.createOscillator();
    birdOsc.type = 'sine';
    birdOsc.frequency.value = 2100;
    const birdLfo = context.createOscillator();
    birdLfo.type = 'triangle';
    birdLfo.frequency.value = 0.22;
    const birdDepth = context.createGain();
    birdDepth.gain.value = 720;
    birdLfo.connect(birdDepth);
    birdDepth.connect(birdOsc.frequency);
    const birdEnvelope = context.createGain();
    birdEnvelope.gain.value = 0.05;
    birdOsc.connect(birdEnvelope);
    birdEnvelope.connect(birdsGain);
    birdOsc.start();
    birdLfo.start();

    audioContextRef.current = context;
    masterGainRef.current = masterGain;
    rainGainRef.current = rainGain;
    cafeGainRef.current = cafeGain;
    lofiGainRef.current = lofiGain;
    windGainRef.current = windGain;
    fireplaceGainRef.current = fireplaceGain;
    forestGainRef.current = forestGain;
    thunderGainRef.current = thunderGain;
    birdsGainRef.current = birdsGain;
    whiteNoiseGainRef.current = whiteNoiseGain;
    updateMixerGains();

    const onLevel = () => AMBIENT_CHANNEL_LEVEL;
    ambientIntervalRef.current = window.setInterval(() => {
      if (
        !audioContextRef.current ||
        !rainGainRef.current ||
        !cafeGainRef.current ||
        !lofiGainRef.current ||
        !windGainRef.current ||
        !fireplaceGainRef.current ||
        !forestGainRef.current ||
        !thunderGainRef.current ||
        !birdsGainRef.current ||
        !whiteNoiseGainRef.current
      ) {
        return;
      }
      const nowTime = audioContextRef.current.currentTime;
      const enabled = ambientEnabledRef.current;
      const drift = () => 0.82 + Math.random() * 0.36;
      const o = onLevel();
      rainGainRef.current.gain.linearRampToValueAtTime((enabled.rain ? o : 0) * 0.42 * drift(), nowTime + 1.8);
      cafeGainRef.current.gain.linearRampToValueAtTime((enabled.cafe ? o : 0) * 0.35 * drift(), nowTime + 2.3);
      lofiGainRef.current.gain.linearRampToValueAtTime(
        (enabled.lofi ? o : 0) * 0.24 * (0.92 + Math.random() * 0.16),
        nowTime + 2.8,
      );
      windGainRef.current.gain.linearRampToValueAtTime((enabled.wind ? o : 0) * 0.26 * drift(), nowTime + 2.1);
      fireplaceGainRef.current.gain.linearRampToValueAtTime(
        (enabled.fireplace ? o : 0) * 0.28 * (0.75 + Math.random() * 0.55),
        nowTime + 1.1,
      );
      forestGainRef.current.gain.linearRampToValueAtTime((enabled.forest ? o : 0) * 0.26 * drift(), nowTime + 2.4);
      thunderGainRef.current.gain.linearRampToValueAtTime(
        (enabled.thunder ? o : 0) * 0.34 * (Math.random() > 0.72 ? 1.4 : 0.55),
        nowTime + 3.6,
      );
      birdsGainRef.current.gain.linearRampToValueAtTime(
        (enabled.birds ? o : 0) * 0.2 * (Math.random() > 0.55 ? 1.15 : 0.6),
        nowTime + 1.2,
      );
      whiteNoiseGainRef.current.gain.linearRampToValueAtTime(
        (enabled.whiteNoise ? o : 0) * 0.3 * (0.94 + Math.random() * 0.12),
        nowTime + 1.9,
      );
    }, 2000);

    ambientBroadcastRef.current?.postMessage({
      type: 'stop-engine',
      tabId: ambientTabIdRef.current,
    });
  };

  useEffect(() => {
    const bc = new BroadcastChannel(AMBIENT_AUDIO_BROADCAST_CHANNEL);
    ambientBroadcastRef.current = bc;
    const tabId = ambientTabIdRef.current;
    bc.onmessage = (event: MessageEvent<AmbientAudioBroadcastMessage>) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'stop-engine') {
        if (data.tabId === tabId) return;
        stopAmbientAudioRef.current();
        return;
      }
      if (data.type === 'ambient-master-volume') {
        if (data.tabId === tabId) return;
        applyAmbientMasterVolume(data.value, true);
      }
    };
    return () => {
      bc.close();
      if (ambientBroadcastRef.current === bc) {
        ambientBroadcastRef.current = null;
      }
    };
  }, [applyAmbientMasterVolume]);

  useEffect(() => {
    if (!isAmbientPlaying) {
      stopAmbientAudio();
      return;
    }
    if (!ambientOwnerTabId) {
      setAmbientOwnerTabId(ambientTabIdRef.current);
      return;
    }
    if (ambientOwnerTabId !== ambientTabIdRef.current) {
      stopAmbientAudio();
      return;
    }
    if (audioContextRef.current) return;
    void startAmbientAudio();
  }, [isAmbientPlaying, ambientOwnerTabId]);

  useEffect(() => {
    window.localStorage.setItem(AMBIENT_SESSION_ACTIVE_STORAGE_KEY, isAmbientPlaying ? '1' : '0');
    if (!isAmbientPlaying) {
      window.localStorage.removeItem(AMBIENT_SESSION_OWNER_TAB_STORAGE_KEY);
      setAmbientOwnerTabId(null);
    }
  }, [isAmbientPlaying]);

  useEffect(() => {
    if (ambientOwnerTabId) {
      window.localStorage.setItem(AMBIENT_SESSION_OWNER_TAB_STORAGE_KEY, ambientOwnerTabId);
      return;
    }
    window.localStorage.removeItem(AMBIENT_SESSION_OWNER_TAB_STORAGE_KEY);
  }, [ambientOwnerTabId]);

  useEffect(() => {
    if (suppressAmbientVolumeSyncRef.current) {
      suppressAmbientVolumeSyncRef.current = false;
      return;
    }
    window.localStorage.setItem(AMBIENT_MASTER_VOLUME_STORAGE_KEY, String(ambientMasterVolume));
    ambientBroadcastRef.current?.postMessage({
      type: 'ambient-master-volume',
      tabId: ambientTabIdRef.current,
      value: ambientMasterVolume,
    });
  }, [ambientMasterVolume]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;

      if (event.key === AMBIENT_SESSION_ACTIVE_STORAGE_KEY && event.newValue != null) {
        const next = event.newValue === '1' || event.newValue === 'true';
        setIsAmbientPlaying(next);
        if (!next) setAmbientOwnerTabId(null);
        return;
      }

      if (event.key === AMBIENT_SESSION_OWNER_TAB_STORAGE_KEY) {
        const next = event.newValue?.trim() || null;
        setAmbientOwnerTabId(next);
        return;
      }

      if (event.key === AMBIENT_MASTER_VOLUME_STORAGE_KEY && event.newValue != null) {
        applyAmbientMasterVolume(event.newValue, true);
        return;
      }

      if (event.key === AMBIENT_MIXER_ENABLED_STORAGE_KEY && event.newValue) {
        const parsed = parseAmbientEnabledJson(event.newValue);
        if (parsed) setAmbientEnabled(parsed);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [applyAmbientMasterVolume]);

  const cardItems = useMemo(
    () => [
      {
        id: 'todos' as const,
        title: 'Todo List',
        dockLabel: 'Tasks',
        dockIcon: <ListTodo size={20} />,
        className: 'absolute left-[24rem] top-24 w-[22rem]',
        content: (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTodoText}
                onChange={(event) => setNewTodoText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') addTodoItem();
                }}
                placeholder="Add a task..."
                className="h-9 flex-1 rounded-lg border border-white/30 bg-white/15 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-700/65 focus:ring-2 dark:bg-black/20 dark:text-slate-100 dark:placeholder:text-slate-300/55"
                style={{ '--tw-ring-color': activeTheme.accentSoftBg } as CSSProperties}
              />
              <button
                type="button"
                onClick={addTodoItem}
                className="h-9 rounded-lg border px-3 text-xs font-medium transition"
                style={{
                  borderColor: activeTheme.accentSoftBorder,
                  backgroundColor: activeTheme.accentSoftBg,
                  color: activeTheme.accentText,
                }}
              >
                Add
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-700/90 dark:text-slate-200/80">
              <span>{incompleteTodoCount} active</span>
              <span>{completedTodoCount} done</span>
            </div>

            <div className="hide-scrollbar max-h-52 space-y-1.5 overflow-y-auto pr-1">
              {todoItems.length === 0 ? (
                <p className="rounded-lg border border-dashed border-white/30 bg-white/10 px-3 py-3 text-xs text-slate-700/85 dark:text-slate-200/75">
                  No tasks yet. Add one to get started.
                </p>
              ) : (
                todoItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-2.5 py-2 dark:bg-black/15"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTodoItem(item.id)}
                      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-white/45 transition"
                      style={
                        item.completed
                          ? {
                              borderColor: activeTheme.accentSoftBorder,
                              backgroundColor: activeTheme.accent,
                            }
                          : undefined
                      }
                      aria-label={`${item.completed ? 'Mark as active' : 'Mark as completed'}: ${item.text}`}
                      title={item.completed ? 'Mark as active' : 'Mark as completed'}
                    >
                      {item.completed ? <span className="text-[10px] font-bold text-slate-950">✓</span> : null}
                    </button>
                    <p
                      className={`min-w-0 flex-1 text-sm ${
                        item.completed
                          ? 'text-slate-600/90 line-through dark:text-slate-300/65'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {item.text}
                    </p>
                    <button
                      type="button"
                      onClick={() => deleteTodoItem(item.id)}
                      className="rounded px-1.5 py-0.5 text-xs text-slate-700/80 transition hover:bg-white/20 hover:text-slate-900 dark:text-slate-200/80 dark:hover:text-slate-100"
                      aria-label={`Delete task: ${item.text}`}
                      title="Delete task"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearCompletedTodos}
                disabled={completedTodoCount === 0}
                className="rounded-lg border border-white/30 bg-white/12 px-3 py-1.5 text-[11px] font-medium text-slate-800 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-45 dark:text-slate-100"
              >
                Clear completed
              </button>
            </div>
          </div>
        ),
      },
      {
        id: 'note' as const,
        title: 'Quick Note',
        dockLabel: 'Notes',
        dockIcon: <NotebookPen size={20} />,
        className: 'absolute right-8 top-8 w-[22rem]',
        content: (
          <div className="min-w-0">
            <QuickNoteTextarea value={quickNote} onChange={setQuickNote} theme={activeTheme} />
          </div>
        ),
      },
      {
        id: 'timer' as const,
        title: 'Pomodoro Timer',
        dockLabel: 'Timer',
        dockIcon: <Timer size={20} />,
        className: 'absolute left-6 top-6 w-[20rem]',
        content: timerCardContent,
      },
      {
        id: 'countdown' as const,
        title: 'Countdown',
        dockLabel: 'Countdown',
        dockIcon: <CalendarClock size={20} />,
        className: 'absolute left-6 top-[22rem] w-[20rem]',
        content: countdownCardContent,
      },
      {
        id: 'music' as const,
        title: 'Live Music',
        dockLabel: 'Music',
        dockIcon: <Music2 size={20} />,
        className: 'absolute right-[24rem] top-[20rem] w-[24rem]',
        content: <LofiMusicCard theme={activeTheme} />,
      },
      {
        id: 'bookmarks' as const,
        title: 'Bookmarks Bar',
        dockLabel: 'Bookmarks',
        dockIcon: <Bookmark size={20} />,
        className: 'absolute left-0 top-0 w-[20rem]',
        content: null,
      },
      {
        id: 'audio' as const,
        title: 'Ambient Audio Mixer',
        dockLabel: 'Sound',
        dockIcon: <Music2 size={20} />,
        className: 'absolute left-[10rem] top-[20rem] w-[24rem]',
        content: (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAmbientPlaying((prev) => {
                    const next = !prev;
                    setAmbientOwnerTabId(next ? ambientTabIdRef.current : null);
                    return next;
                  });
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition hover:opacity-95"
                style={{
                  borderColor: activeTheme.accentSoftBorder,
                  backgroundColor: activeTheme.accentSoftBg,
                  color: activeTheme.accentText,
                }}
                aria-label={isAmbientPlaying ? 'Stop ambient audio' : 'Play ambient audio'}
                title={isAmbientPlaying ? 'Stop' : 'Play'}
              >
                {isAmbientPlaying ? (
                  <Square size={16} fill="currentColor" strokeWidth={0} className="rounded-[2px]" />
                ) : (
                  <Play size={20} className="ml-0.5" aria-hidden />
                )}
              </button>
              <label className="flex min-h-10 min-w-0 flex-1 items-center gap-2">
                <span className="sr-only">Master volume</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={ambientMasterVolume}
                  onChange={(event) => applyAmbientMasterVolume(event.target.value, false)}
                  className="h-6 min-w-0 flex-1"
                  style={{ accentColor: activeTheme.accent }}
                />
                <span className="shrink-0 text-[10px] tabular-nums leading-none text-slate-600 dark:text-slate-300">
                  {ambientMasterVolume}%
                </span>
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {ambientChannelMeta.map(({ id, label, Icon }) => {
                const on = ambientEnabled[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAmbientEnabled((prev) => ({ ...prev, [id]: !prev[id] }))}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
                      on ? 'shadow-sm' : 'border-white/25 bg-white/10 hover:bg-white/15'
                    }`}
                    style={
                      on
                        ? {
                            borderColor: activeTheme.accentSoftBorder,
                            backgroundColor: activeTheme.accentSoftBg,
                            color: activeTheme.accentText,
                          }
                        : undefined
                    }
                    aria-pressed={on}
                    aria-label={on ? `Turn off ${label}` : `Turn on ${label}`}
                    title={label}
                  >
                    <Icon size={18} strokeWidth={on ? 2.25 : 1.65} className={on ? '' : 'text-slate-200/75'} />
                  </button>
                );
              })}
            </div>
          </div>
        ),
      },
    ],
    [
      activeTheme,
      ambientEnabled,
      ambientMasterVolume,
      completedTodoCount,
      incompleteTodoCount,
      isAmbientPlaying,
      newTodoText,
      quickNote,
      countdownCardContent,
      timerCardContent,
      todoItems,
    ],
  );

  const toggleCard = (cardId: keyof typeof visibleCards) => {
    if (cardId === 'bookmarks') {
      setPreferences((prev) => {
        const next = !prev.showBookmarkBar;
        setVisibleCards((cardPrev) => ({
          ...cardPrev,
          bookmarks: next,
        }));
        return {
          ...prev,
          showBookmarkBar: next,
        };
      });
      return;
    }
    setVisibleCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const toggleDockItem = (cardId: CardId) => {
    setVisibleDockItems((prev) => {
      const nextIsVisible = !prev[cardId];
      if (cardId === 'bookmarks' && !nextIsVisible) {
        setPreferences((prefPrev) => ({
          ...prefPrev,
          showBookmarkBar: false,
        }));
      }
      setVisibleCards((cardPrev) => ({
        ...cardPrev,
        [cardId]: nextIsVisible ? cardPrev[cardId] : false,
      }));
      return {
        ...prev,
        [cardId]: nextIsVisible,
      };
    });
  };

  const updateCardPosition = (cardId: CardId, position: Position) => {
    const safe = sanitizePosition(position);
    setCardPositions((prev) => {
      const next = { ...prev, [cardId]: safe };
      window.localStorage.setItem(CARD_POSITIONS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const bringCardToFront = (cardId: CardId) => {
    setCardTouchOrder((prev) => [...prev.filter((id) => id !== cardId), cardId]);
  };
  const closeCard = (cardId: CardId) => {
    if (cardId === 'bookmarks') {
      setPreferences((prev) => ({
        ...prev,
        showBookmarkBar: false,
      }));
    }
    setVisibleCards((prev) => ({
      ...prev,
      [cardId]: false,
    }));
  };
  const resetCardPosition = (cardId: CardId) => {
    updateCardPosition(cardId, defaultCardPositions[cardId]);
  };
  const openCardContextMenu = (cardId: CardId, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    bringCardToFront(cardId);
    setCardContextMenu({
      cardId,
      x: event.clientX,
      y: event.clientY,
    });
  };

  useLayoutEffect(() => {
    const el = dockAsideRef.current;
    if (!el) return;

    const syncHalfWidth = () => {
      dockRevealHalfWidthRef.current = el.getBoundingClientRect().width / 2;
    };

    syncHalfWidth();
    const ro = new ResizeObserver(syncHalfWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const revealThresholdY = 140;

    const handleMouseMove = (event: MouseEvent) => {
      const nearBottom = event.clientY >= window.innerHeight - revealThresholdY;
      const nearDockX = Math.abs(event.clientX - window.innerWidth / 2) <= dockRevealHalfWidthRef.current;
      setIsDockVisible(nearBottom && nearDockX);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(QUICK_NOTE_STORAGE_KEY, quickNote);
  }, [quickNote]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== QUICK_NOTE_STORAGE_KEY) return;
      setQuickNote(event.newValue ?? '');
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(TODO_LIST_STORAGE_KEY, JSON.stringify(todoItems));
  }, [todoItems]);

  useEffect(() => {
    window.localStorage.setItem(COUNTDOWN_TARGET_STORAGE_KEY, countdownTargetIso);
  }, [countdownTargetIso]);

  useEffect(() => {
    window.localStorage.setItem(VISIBLE_CARDS_STORAGE_KEY, JSON.stringify(visibleCards));
  }, [visibleCards]);

  useEffect(() => {
    window.localStorage.setItem(VISIBLE_DOCK_ITEMS_STORAGE_KEY, JSON.stringify(visibleDockItems));
  }, [visibleDockItems]);

  useEffect(() => {
    setVisibleCards((prev) => {
      if (prev.bookmarks === preferences.showBookmarkBar) return prev;
      return {
        ...prev,
        bookmarks: preferences.showBookmarkBar,
      };
    });
  }, [preferences.showBookmarkBar]);

  useEffect(() => {
    ambientEnabledRef.current = ambientEnabled;
  }, [ambientEnabled]);

  useEffect(() => {
    ambientMasterVolumeRef.current = ambientMasterVolume;
  }, [ambientMasterVolume]);

  useEffect(() => {
    window.localStorage.setItem(AMBIENT_MIXER_ENABLED_STORAGE_KEY, JSON.stringify(ambientEnabled));
    if (isAmbientPlaying) updateMixerGains();
  }, [ambientEnabled, isAmbientPlaying]);

  useEffect(() => {
    if (!isAmbientPlaying) return;
    updateMixerGains();
  }, [ambientMasterVolume, isAmbientPlaying, ambientEnabled]);

  useEffect(
    () => () => {
      stopAmbientAudio();
    },
    [],
  );

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== TODO_LIST_STORAGE_KEY) return;
      setTodoItems(loadStoredTodos());
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === COUNTDOWN_TARGET_STORAGE_KEY) {
        setCountdownTargetIso(event.newValue ?? '');
        return;
      }
      if (event.key === VISIBLE_CARDS_STORAGE_KEY) {
        setVisibleCards(loadStoredCardVisibility(VISIBLE_CARDS_STORAGE_KEY, defaultCardVisibility));
      }
      if (event.key === VISIBLE_DOCK_ITEMS_STORAGE_KEY) {
        setVisibleDockItems(loadStoredCardVisibility(VISIBLE_DOCK_ITEMS_STORAGE_KEY, defaultDockItemVisibility));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useLayoutEffect(() => {
    updateDockScrollOverflow();
    const el = dockScrollRowRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateDockScrollOverflow());
    ro.observe(el);
    window.addEventListener('resize', updateDockScrollOverflow);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateDockScrollOverflow);
    };
  }, [updateDockScrollOverflow, visibleDockItems]);

  useEffect(() => {
    if (!cardContextMenu) return;

    const closeIfOutside = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (cardContextMenuRef.current?.contains(target)) return;
      setCardContextMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setCardContextMenu(null);
    };
    const closeOnLayoutChange = () => setCardContextMenu(null);

    window.addEventListener('pointerdown', closeIfOutside);
    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnLayoutChange);
    window.addEventListener('blur', closeOnLayoutChange);
    window.addEventListener('scroll', closeOnLayoutChange, true);
    return () => {
      window.removeEventListener('pointerdown', closeIfOutside);
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnLayoutChange);
      window.removeEventListener('blur', closeOnLayoutChange);
      window.removeEventListener('scroll', closeOnLayoutChange, true);
    };
  }, [cardContextMenu]);

  const contextMenuCard = cardContextMenu ? cardItems.find((card) => card.id === cardContextMenu.cardId) ?? null : null;
  const contextMenuPosition = useMemo(() => {
    if (!cardContextMenu) return null;
    if (typeof window === 'undefined') return { left: cardContextMenu.x, top: cardContextMenu.y };
    const menuWidth = 224;
    const menuHeight = 158;
    const margin = 12;
    const left = Math.min(cardContextMenu.x, window.innerWidth - menuWidth - margin);
    const top = Math.min(cardContextMenu.y, window.innerHeight - menuHeight - margin);
    return {
      left: Math.max(margin, left),
      top: Math.max(margin, top),
    };
  }, [cardContextMenu]);

  const shouldShowDock = isDockVisible || isDockHovered || isSettingsOpen;
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore unsupported or blocked fullscreen requests.
    }
  };
  const activeBackground = useMemo(() => {
    if (selectedBackground === 'custom' && customWallpaper?.url) {
      return {
        id: 'custom' as const,
        name: 'Custom',
        imageUrl: customWallpaper.url,
      };
    }
    return backgroundOptions.find((option) => option.id === selectedBackground) ?? backgroundOptions[0];
  }, [selectedBackground, customWallpaper]);
  const onCustomWallpaperUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setCustomWallpaperError('Please choose an image file.');
      event.target.value = '';
      return;
    }
    const maxBytes = 12 * 1024 * 1024;
    if (file.size > maxBytes) {
      setCustomWallpaperError('Image is too large (max 12MB).');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        setCustomWallpaperError('Could not read image file.');
        return;
      }
      setCustomWallpaperError(null);
      setCustomWallpaper({ url: result });
      setSelectedBackground('custom');
      window.localStorage.setItem(SELECTED_BACKGROUND_STORAGE_KEY, 'custom');
      event.target.value = '';
    };
    reader.onerror = () => {
      setCustomWallpaperError('Could not read image file.');
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  }, []);

  const clearCustomWallpaper = useCallback(() => {
    setCustomWallpaper(null);
    setCustomWallpaperError(null);
    if (selectedBackground === 'custom') {
      setSelectedBackground('ios-blue');
      window.localStorage.setItem(SELECTED_BACKGROUND_STORAGE_KEY, 'ios-blue');
    }
  }, [selectedBackground]);
  const formattedTime = useMemo(
    () =>
      now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    [now],
  );
  const formattedDate = useMemo(
    () =>
      now.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [now],
  );
  const clockDisplayClasses = useMemo(() => {
    switch (clockSize) {
      case 'small':
        return { time: 'text-7xl', date: 'text-xl', gap: 'gap-2' };
      case 'medium':
        return { time: 'text-8xl', date: 'text-2xl', gap: 'gap-2.5' };
      case 'large':
        return { time: 'text-9xl', date: 'text-3xl', gap: 'gap-3' };
    }
  }, [clockSize]);

  const clockPositionContainerClass = useMemo(() => {
    const base = 'pointer-events-none fixed inset-0 z-0 flex';
    const topBar =
      preferences.showBookmarkBar && (clockPosition === 'top-left' || clockPosition === 'top' || clockPosition === 'top-right')
        ? 'pt-14 sm:pt-16'
        : '';
    const edge = 'px-6 py-6 sm:px-8 sm:py-8';
    const bottomClear = 'pb-24 sm:pb-28';

    switch (clockPosition) {
      case 'top-left':
        return `${base} items-start justify-start ${edge} ${topBar}`;
      case 'top':
        return `${base} items-start justify-center ${edge} ${topBar}`;
      case 'top-right':
        return `${base} items-start justify-end ${edge} ${topBar}`;
      case 'left':
        return `${base} items-center justify-start ${edge}`;
      case 'center':
        return `${base} items-center justify-center`;
      case 'right':
        return `${base} items-center justify-end ${edge}`;
      case 'bottom-left':
        return `${base} items-end justify-start ${edge} ${bottomClear}`;
      case 'bottom':
        return `${base} items-end justify-center ${edge} ${bottomClear}`;
      case 'bottom-right':
        return `${base} items-end justify-end ${edge} ${bottomClear}`;
      default:
        return `${base} items-center justify-center`;
    }
  }, [clockPosition, preferences.showBookmarkBar]);

  const clockStackAlignClass = useMemo(() => {
    switch (clockPosition) {
      case 'left':
      case 'top-left':
      case 'bottom-left':
        return 'items-start text-left';
      case 'right':
      case 'top-right':
      case 'bottom-right':
        return 'items-end text-right';
      default:
        return 'items-center text-center';
    }
  }, [clockPosition]);

  const wallpaperSettings = [
    {
      id: 'showBackgroundDimmer' as const,
      label: 'Background Dimmer',
      description: 'Toggle the dark overlay on top of the wallpaper.',
    },
    {
      id: 'showBackgroundBlur' as const,
      label: 'Background Blur',
      description: 'Apply a soft blur effect to the wallpaper.',
    },
  ];
  const clockSettings = [
    {
      id: 'showCenterTime' as const,
      label: 'Show clock',
      description: 'Display the current time on the new tab (position is set below).',
    },
    {
      id: 'showCenterDate' as const,
      label: 'Show date',
      description: 'Display the current date below the time.',
    },
    {
      id: 'use24HourTime' as const,
      label: 'Use 24-Hour Time',
      description: 'Switch between 12-hour and 24-hour clock format.',
    },
  ];
  const bookmarkSettings = [
    {
      id: 'showBookmarkBar' as const,
      label: 'Bookmarks bar',
      description: 'Show the same bookmarks as Chrome’s bookmarks bar (top strip; folders open on click).',
    },
  ];
  const dockVisibilitySettings = cardItems.map((card) => ({
    id: card.id,
    label: `Show ${card.dockLabel} in Dock`,
    description: `Show or hide the ${card.title} dock button and widget.`,
  }));

  /** Shell only: avoid opacity/scale here — they sit above backdrop-filter and blur would not fade (see GlassCard glass layer). */
  const cardShellVariants = {
    initial: { y: 10, transition: { duration: 0.16, ease: 'easeOut' as const } },
    animate: { y: 0, transition: { duration: 0.16, ease: 'easeOut' as const } },
    exit: { y: 8, transition: { duration: 0.16, ease: 'easeOut' as const } },
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <LiquidGlassFilterDefs />
      <AnimatePresence>
        {preferences.showBookmarkBar ? (
          <BookmarkBar
            key="bookmark-bar"
            theme={{
              accentText: activeTheme.accentText,
              accentSoftBg: activeTheme.accentSoftBg,
              accentSoftBorder: activeTheme.accentSoftBorder,
            }}
          />
        ) : null}
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-0">
        <img
          src={activeBackground.imageUrl}
          alt={activeBackground.name}
          className={`h-full w-full object-cover transition ${preferences.showBackgroundBlur ? 'blur-[3px] scale-[1.02]' : ''}`}
        />
        {preferences.showBackgroundDimmer ? <div className="absolute inset-0 bg-slate-950/55" /> : null}
      </div>

      <section
        className={`relative h-full w-full px-5 pb-5 pt-5 ${isSettingsOpen ? 'z-[45]' : 'z-10'}`}
      >
        <div ref={dragBoundaryRef} className="relative h-full">
          <AnimatePresence>
            {preferences.showCenterTime ? (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.99 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className={clockPositionContainerClass}
              >
                <div className={`flex flex-col ${clockStackAlignClass} ${clockDisplayClasses.gap}`}>
                  <p
                    className={`select-none font-semibold tracking-tight text-slate-100/95 drop-shadow-[0_3px_20px_rgba(0,0,0,0.45)] ${clockDisplayClasses.time}`}
                  >
                    {formattedTime}
                  </p>
                  {preferences.showCenterDate ? (
                    <p
                      className={`select-none font-medium tracking-wide text-slate-100/85 drop-shadow-[0_2px_14px_rgba(0,0,0,0.35)] ${clockDisplayClasses.date}`}
                    >
                      {formattedDate}
                    </p>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {cardItems.map((card) =>
              card.id !== 'bookmarks' && visibleCards[card.id] ? (
                <motion.div
                  key={card.id}
                  variants={cardShellVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className={`pointer-events-none isolate ${card.className}`}
                  style={{
                    zIndex: (() => {
                      const idx = cardTouchOrder.indexOf(card.id);
                      if (idx === -1) return 20;
                      // One step per touched card (no cap) — capping at 23 caused ties when 4+ widgets
                      // were activated, so stacking fell back to DOM order instead of recency.
                      return 21 + idx;
                    })(),
                  }}
                >
                  <GlassCard
                    title={card.title}
                    className="w-full min-w-0"
                    position={cardPositions[card.id]}
                    dragBoundaryRef={dragBoundaryRef}
                    onActivate={() => bringCardToFront(card.id)}
                    onContextMenu={(event) => openCardContextMenu(card.id, event)}
                    onDragEnd={(position) => updateCardPosition(card.id, position)}
                  >
                    {card.content}
                  </GlassCard>
                </motion.div>
              ) : null,
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isSettingsOpen ? (
              <>
                <motion.button
                  key="settings-backdrop"
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="fixed inset-0 z-[29] cursor-default border-0 bg-slate-950/35 p-0"
                  aria-label="Close settings"
                  onClick={() => setIsSettingsOpen(false)}
                />
                <motion.aside
                  key="settings-panel"
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 40, opacity: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="fixed inset-y-3 right-3 z-30 isolate flex w-[26rem] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl text-slate-100"
                >
                <div
                  className={`pointer-events-none absolute inset-0 z-0 ${chromeGlassSurfaceClasses} ${chromeGlassRadiusSettings}`}
                  aria-hidden
                />
                <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-white/15 px-4 py-3">
                  <h2 className="text-sm font-semibold tracking-wide text-slate-100">Settings</h2>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="rounded-lg border border-white/20 bg-white/10 p-1.5 text-slate-100 transition hover:bg-white/20"
                    aria-label="Close Settings"
                    title="Close Settings"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="hide-scrollbar flex-1 overflow-y-auto px-4 py-3">
                  <div className="space-y-5">
                    <div className="mb-1">
                      <p className="text-xs leading-relaxed text-slate-700/85 dark:text-slate-200/80">
                        This window is scaffolded for future preference controls. Current options are dummy toggles.
                      </p>
                    </div>
                    <section className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-200/80">Theme</p>
                      <div className="grid grid-cols-4 gap-2">
                        {themeOptions.map((theme) => {
                          const isActive = selectedTheme === theme.id;
                          return (
                            <button
                              key={theme.id}
                              type="button"
                              onClick={() => {
                                setSelectedTheme(theme.id);
                                window.localStorage.setItem(SELECTED_THEME_STORAGE_KEY, theme.id);
                              }}
                              className="rounded-xl border px-2 py-2 text-left text-xs transition"
                              style={{
                                borderColor: isActive ? theme.accentSoftBorder : 'rgba(255,255,255,0.25)',
                                backgroundColor: isActive ? theme.accentSoftBg : 'rgba(255,255,255,0.05)',
                                color: isActive ? theme.accentText : 'rgba(226,232,240,0.9)',
                                boxShadow: isActive ? `0 0 0 1px ${theme.accentSoftBorder}` : undefined,
                              }}
                              aria-label={`Select ${theme.name} theme color`}
                              title={`Select ${theme.name}`}
                            >
                              <span className="mb-1 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                              <div>{theme.name}</div>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                    <section className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-200/80">Wallpaper</p>
                      <div className="grid grid-cols-2 gap-2">
                        {backgroundOptions.map((background) => {
                          const isActive = selectedBackground === background.id;
                          return (
                            <button
                              key={background.id}
                              type="button"
                              onClick={() => {
                                setSelectedBackground(background.id);
                                window.localStorage.setItem(SELECTED_BACKGROUND_STORAGE_KEY, background.id);
                              }}
                              className={`overflow-hidden rounded-xl border transition ${
                                isActive ? 'ring-1' : 'border-white/25 hover:border-white/45'
                              }`}
                              style={isActive ? { borderColor: activeTheme.accentSoftBorder, boxShadow: `0 0 0 1px ${activeTheme.accentSoftBorder}` } : undefined}
                              aria-label={`Select ${background.name} background`}
                              title={`Select ${background.name}`}
                            >
                              <img src={background.imageUrl} alt={background.name} className="h-20 w-full object-cover" />
                              <div className="border-t border-white/10 bg-black/35 px-2 py-1 text-left text-xs text-slate-100">
                                {background.name}
                              </div>
                            </button>
                          );
                        })}
                        <button
                          key="custom-upload"
                          type="button"
                          disabled={!customWallpaper}
                          onClick={() => {
                            if (!customWallpaper) return;
                            setSelectedBackground('custom');
                            window.localStorage.setItem(SELECTED_BACKGROUND_STORAGE_KEY, 'custom');
                          }}
                          className={`overflow-hidden rounded-xl border transition ${
                            selectedBackground === 'custom' ? 'ring-1' : 'border-white/25 hover:border-white/45'
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                          style={
                            selectedBackground === 'custom'
                              ? { borderColor: activeTheme.accentSoftBorder, boxShadow: `0 0 0 1px ${activeTheme.accentSoftBorder}` }
                              : undefined
                          }
                          aria-label="Use uploaded wallpaper"
                          title={customWallpaper ? 'Use your uploaded wallpaper' : 'Upload an image below first'}
                        >
                          {customWallpaper ? (
                            <img
                              src={customWallpaper.url}
                              alt="Uploaded custom wallpaper"
                              className="h-20 w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-20 w-full items-center justify-center bg-white/5 px-2 text-center text-[11px] text-slate-300/90">
                              Upload
                            </div>
                          )}
                          <div className="border-t border-white/10 bg-black/35 px-2 py-1 text-left text-xs text-slate-100">
                            Custom (uploaded)
                          </div>
                        </button>
                      </div>
                      <div className="space-y-2 rounded-xl border border-white/15 bg-white/5 p-3">
                        <p className="text-[11px] font-medium text-slate-200/85">Upload custom wallpaper</p>
                        <input
                          ref={customWallpaperFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={onCustomWallpaperUpload}
                          className="hidden"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => customWallpaperFileInputRef.current?.click()}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/15"
                            style={{ '--tw-ring-color': activeTheme.accentSoftBg } as CSSProperties}
                          >
                            <ImagePlus size={16} />
                            Choose image
                          </button>
                          {customWallpaper ? (
                            <button
                              type="button"
                              onClick={clearCustomWallpaper}
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/15"
                              style={{ '--tw-ring-color': activeTheme.accentSoftBg } as CSSProperties}
                            >
                              <Trash2 size={16} />
                              Remove upload
                            </button>
                          ) : null}
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-300/75">
                          Upload an image from your computer. It is stored locally in your browser storage.
                        </p>
                        {customWallpaperError ? (
                          <p className="text-[11px] text-rose-300/95">{customWallpaperError}</p>
                        ) : null}
                      </div>
                      {wallpaperSettings.map((setting) => (
                        <SettingToggle
                          key={setting.id}
                          label={setting.label}
                          description={setting.description}
                          enabled={preferences[setting.id]}
                          theme={activeTheme}
                          onChange={() =>
                            setPreferences((prev) => ({
                              ...prev,
                              [setting.id]: !prev[setting.id],
                            }))
                          }
                        />
                      ))}
                    </section>
                    <section className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-200/80">Clock</p>
                      {clockSettings.map((setting) => (
                        <SettingToggle
                          key={setting.id}
                          label={setting.label}
                          description={setting.description}
                          enabled={preferences[setting.id]}
                          theme={activeTheme}
                          onChange={() =>
                            setPreferences((prev) => ({
                              ...prev,
                              [setting.id]: !prev[setting.id],
                            }))
                          }
                        />
                      ))}
                      <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                        <p className="mb-2 text-sm font-medium text-slate-100">Clock size</p>
                        <div className="grid grid-cols-3 gap-2">
                          {(
                            [
                              { id: 'small' as const, label: 'Small' },
                              { id: 'medium' as const, label: 'Medium' },
                              { id: 'large' as const, label: 'Large' },
                            ] as const
                          ).map(({ id, label }) => {
                            const isActive = clockSize === id;
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => setClockSize(id)}
                                className="rounded-lg border px-2 py-2 text-center text-xs font-medium transition"
                                style={{
                                  borderColor: isActive ? activeTheme.accentSoftBorder : 'rgba(255,255,255,0.25)',
                                  backgroundColor: isActive ? activeTheme.accentSoftBg : 'rgba(255,255,255,0.05)',
                                  color: isActive ? activeTheme.accentText : 'rgba(226,232,240,0.9)',
                                  boxShadow: isActive ? `0 0 0 1px ${activeTheme.accentSoftBorder}` : undefined,
                                }}
                                aria-pressed={isActive}
                                aria-label={`${label} center clock`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                        <p className="mb-2 text-sm font-medium text-slate-100">Clock position</p>
                        <div className="grid grid-cols-3 gap-2">
                          {CLOCK_POSITIONS.map((id) => {
                            const isActive = clockPosition === id;
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => setClockPosition(id)}
                                className="rounded-lg border px-1.5 py-2 text-center text-[11px] font-medium leading-tight transition"
                                style={{
                                  borderColor: isActive ? activeTheme.accentSoftBorder : 'rgba(255,255,255,0.25)',
                                  backgroundColor: isActive ? activeTheme.accentSoftBg : 'rgba(255,255,255,0.05)',
                                  color: isActive ? activeTheme.accentText : 'rgba(226,232,240,0.9)',
                                  boxShadow: isActive ? `0 0 0 1px ${activeTheme.accentSoftBorder}` : undefined,
                                }}
                                aria-pressed={isActive}
                                aria-label={`Place clock ${CLOCK_POSITION_LABELS[id]}`}
                                title={CLOCK_POSITION_LABELS[id]}
                              >
                                {CLOCK_POSITION_LABELS[id]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </section>
                    <section className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-200/80">Bookmarks</p>
                      {bookmarkSettings.map((setting) => (
                        <SettingToggle
                          key={setting.id}
                          label={setting.label}
                          description={setting.description}
                          enabled={preferences[setting.id]}
                          theme={activeTheme}
                          onChange={() =>
                            setPreferences((prev) => ({
                              ...prev,
                              [setting.id]: !prev[setting.id],
                            }))
                          }
                        />
                      ))}
                    </section>
                    <section className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-200/80">Dock Items</p>
                      {dockVisibilitySettings.map((setting) => (
                        <SettingToggle
                          key={setting.id}
                          label={setting.label}
                          description={setting.description}
                          enabled={visibleDockItems[setting.id]}
                          theme={activeTheme}
                          onChange={() => toggleDockItem(setting.id)}
                        />
                      ))}
                    </section>
                  </div>
                </div>
                </div>
              </motion.aside>
              </>
            ) : null}
          </AnimatePresence>

          <div className="pointer-events-none fixed bottom-3 left-1/2 z-[28] -translate-x-1/2">
            <motion.div
              initial={false}
              animate={{ opacity: shouldShowDock ? 0 : 1, y: shouldShowDock ? 8 : 0 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
            >
              <div
                className={`isolate flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-slate-200/90 ${chromeGlassSurfaceClasses}`}
              >
                <ChevronUp size={16} />
              </div>
            </motion.div>
          </div>

          <div className="pointer-events-none fixed bottom-4 left-1/2 z-[28] -translate-x-1/2">
            <motion.aside
              ref={dockAsideRef}
              initial={false}
              animate={{
                y: shouldShowDock ? 0 : 'calc(100% + 1rem)',
                opacity: shouldShowDock ? 1 : 0,
              }}
              transition={{ type: 'spring', stiffness: 280, damping: 34 }}
              onMouseEnter={() => setIsDockHovered(true)}
              onMouseLeave={() => setIsDockHovered(false)}
              className={`isolate w-[56rem] max-w-[98vw] overflow-hidden p-3 ${chromeGlassRadiusBar} ${chromeGlassSurfaceClasses} ${
                shouldShowDock ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              <div className="relative min-h-0">
                <div
                  ref={dockScrollRowRef}
                  onScroll={updateDockScrollOverflow}
                  onPointerDownCapture={onDockScrollRowPointerDown}
                  onPointerMove={onDockScrollRowPointerMove}
                  onPointerUp={endDockScrollRowGrab}
                  onPointerCancel={endDockScrollRowGrab}
                  onLostPointerCapture={endDockScrollRowGrab}
                  onDragStartCapture={(e) => {
                    if (dockHasHorizontalOverflow) e.preventDefault();
                  }}
                  onClickCapture={onDockScrollRowClickCapture}
                  style={dockScrollFadeMask}
                  className={`hide-scrollbar flex min-h-0 w-full flex-nowrap items-stretch gap-2 overflow-x-auto overflow-y-hidden ${
                    dockHasHorizontalOverflow
                      ? `${dockIsGrabDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`
                      : ''
                  }`}
                >
                {cardItems
                  .filter((card) => visibleDockItems[card.id])
                  .map((card) => {
                  const isVisible = visibleCards[card.id];
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => toggleCard(card.id)}
                      className={`flex min-w-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2.5 transition ${
                        dockHasHorizontalOverflow ? 'shrink-0' : 'min-w-0 flex-1 basis-0'
                      } ${isVisible ? '' : 'border-white/20 bg-white/5 text-slate-200/70 hover:bg-white/15'}`}
                      style={
                        isVisible
                          ? {
                              borderColor: activeTheme.accentSoftBorder,
                              backgroundColor: activeTheme.accentSoftBg,
                              color: activeTheme.accentText,
                            }
                          : undefined
                      }
                      aria-label={`${isVisible ? 'Hide' : 'Show'} ${card.title}`}
                      title={`${isVisible ? 'Hide' : 'Show'} ${card.title}`}
                    >
                      <span className={isVisible ? '[&>svg]:h-5 [&>svg]:w-5' : 'opacity-55 [&>svg]:h-5 [&>svg]:w-5'}>{card.dockIcon}</span>
                      <span
                        className={`text-[11px] leading-none ${isVisible ? '' : 'text-slate-200/75'}`}
                        style={isVisible ? { color: activeTheme.accentText } : undefined}
                      >
                        {card.dockLabel}
                      </span>
                    </button>
                  );
                })}
                <div className="mx-1 w-px shrink-0 self-stretch bg-white/25" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen((prev) => !prev)}
                  className={`flex min-w-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2.5 transition ${
                    dockHasHorizontalOverflow ? 'shrink-0' : 'min-w-0 flex-1 basis-0'
                  } ${isSettingsOpen ? '' : 'border-white/20 bg-white/5 text-slate-200/80 hover:bg-white/15'}`}
                  style={
                    isSettingsOpen
                      ? {
                          borderColor: activeTheme.accentSoftBorder,
                          backgroundColor: activeTheme.accentSoftBg,
                          color: activeTheme.accentText,
                        }
                      : undefined
                  }
                  aria-label={`${isSettingsOpen ? 'Close' : 'Open'} Settings`}
                  title={`${isSettingsOpen ? 'Close' : 'Open'} Settings`}
                >
                  <Settings2 size={20} />
                  <span
                    className={`text-[11px] leading-none ${isSettingsOpen ? '' : 'text-slate-200/75'}`}
                    style={isSettingsOpen ? { color: activeTheme.accentText } : undefined}
                  >
                    Settings
                  </span>
                </button>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className={`flex min-w-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2.5 transition ${
                    dockHasHorizontalOverflow ? 'shrink-0' : 'min-w-0 flex-1 basis-0'
                  } ${isFullscreen ? '' : 'border-white/20 bg-white/5 text-slate-200/80 hover:bg-white/15'}`}
                  style={
                    isFullscreen
                      ? {
                          borderColor: activeTheme.accentSoftBorder,
                          backgroundColor: activeTheme.accentSoftBg,
                          color: activeTheme.accentText,
                        }
                      : undefined
                  }
                  aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  <span
                    className={`text-[11px] leading-none ${isFullscreen ? '' : 'text-slate-200/75'}`}
                    style={isFullscreen ? { color: activeTheme.accentText } : undefined}
                  >
                    Fullscreen
                  </span>
                </button>
                </div>
                {dockCanScrollLeft ? (
                  <div
                    className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-start pl-1"
                    aria-hidden
                  >
                    <ChevronLeft className="size-4 shrink-0 text-slate-100/90 opacity-90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]" />
                  </div>
                ) : null}
                {dockCanScrollRight ? (
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-end pr-1"
                    aria-hidden
                  >
                    <ChevronRight className="size-4 shrink-0 text-slate-100/90 opacity-90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]" />
                  </div>
                ) : null}
              </div>
            </motion.aside>
          </div>
        </div>
      </section>
      {cardContextMenu && contextMenuCard && contextMenuPosition
        ? createPortal(
            <div
              ref={cardContextMenuRef}
              role="menu"
              aria-label={`${contextMenuCard.title} options`}
              className={`fixed z-[80] min-w-56 overflow-hidden rounded-xl border border-white/20 bg-slate-950/90 p-1.5 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl ${chromeGlassSurfaceClasses}`}
              style={{ left: contextMenuPosition.left, top: contextMenuPosition.top }}
            >
              <div className="px-2 py-1.5 text-[11px] uppercase tracking-wide text-slate-300/80">{contextMenuCard.title}</div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  bringCardToFront(contextMenuCard.id);
                  setCardContextMenu(null);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-slate-100 transition hover:bg-white/12"
              >
                Bring to front
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  resetCardPosition(contextMenuCard.id);
                  setCardContextMenu(null);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-slate-100 transition hover:bg-white/12"
              >
                Reset position
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeCard(contextMenuCard.id);
                  setCardContextMenu(null);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-rose-200 transition hover:bg-rose-500/20"
              >
                Close
              </button>
            </div>,
            document.body,
          )
        : null}
    </main>
  );
}
