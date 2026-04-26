export const PRISM_STORAGE_KEYS = {
  cardPositions: 'newtab-card-positions',
  visibleCards: 'newtab-visible-cards',
  visibleDockItems: 'newtab-visible-dock-items',
  selectedBackground: 'newtab-selected-background',
  selectedTheme: 'newtab-selected-theme',
  pomodoro: 'newtab-pomodoro-state',
  quickNote: 'newtab-quick-note',
  todoList: 'newtab-todo-list',
  countdownTarget: 'newtab-countdown-target',
  ambientMixerEnabled: 'newtab-ambient-mixer-enabled',
  preferences: 'newtab-preferences',
  clockSize: 'newtab-clock-size',
  clockPosition: 'newtab-clock-position',
  customWallpaperMeta: 'newtab-custom-wallpaper-meta',
  ambientSessionActive: 'newtab-ambient-session-active',
  ambientSessionOwnerTab: 'newtab-ambient-session-owner-tab',
  ambientMasterVolume: 'newtab-ambient-master-volume',
  lofiMusicVolume: 'newtab-lofi-music-volume',
} as const;

export const PRISM_STORAGE_KEY_LIST = Object.values(PRISM_STORAGE_KEYS);
