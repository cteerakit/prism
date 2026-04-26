/**
 * Shared frosted-glass chrome for widget cards, bookmark bar, dock, and settings
 * so borders, tint, blur, and shadow stay consistent.
 */
export const chromeGlassSurfaceClasses =
  'border border-white/30 bg-white/20 shadow-glass backdrop-blur-glass [backdrop-filter:url(#liquid-glass)_blur(28px)_saturate(180%)] [-webkit-backdrop-filter:url(#liquid-glass)_blur(28px)_saturate(180%)] [transform:translateZ(0)] dark:bg-black/40';

/** Draggable widget shells (e.g. `GlassCard`). */
export const chromeGlassRadiusCard = 'rounded-3xl';

/** Horizontal strips: bookmark bar, dock tray. */
export const chromeGlassRadiusBar = 'rounded-2xl';

/** Settings drawer: floating inset panel with rounded corners. */
export const chromeGlassRadiusSettings = 'rounded-2xl';
