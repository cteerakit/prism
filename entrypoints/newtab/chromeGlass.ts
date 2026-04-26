/**
 * Liquid Glass design system — Apple-style tiered translucent surfaces.
 *
 * The hierarchy mirrors what Apple ships in iOS 26 / macOS Tahoe:
 *
 *   1. SURFACE  — heavy floating chrome (cards, bookmark bar, dock, settings drawer).
 *                 Uses `backdrop-filter` + the SVG `liquid-glass` refraction filter,
 *                 plus a deep ambient drop so cards lift off the wallpaper.
 *   2. THIN     — nested panels inside an already-blurred surface (inputs, todo rows,
 *                 settings sub-cards). No backdrop-filter to avoid Chrome banding when
 *                 stacked, just the gradient + rim that gives the Apple look.
 *   3. BUTTON   — interactive THIN with hover/active/focus states.
 *   4. INPUT    — recessed THIN tuned for editable fields.
 *   5. CHIP     — small pill-shaped chip with the same rim language.
 *   6. POPOVER  — dark popover/tooltip variant.
 *
 * IMPORTANT: Only Tailwind's default opacity steps (5/10/15/20/25/...) work without
 * arbitrary-value brackets. Non-default stops like /8, /12, /14 silently compile to
 * NOTHING in Tailwind 3.4. Use bracket notation `bg-white/[0.08]` for fine-grained tuning.
 */

// ---------------------------------------------------------------------------
// Tier 1 — SURFACE (heavy floating chrome)
// ---------------------------------------------------------------------------

/**
 * Heavy frosted glass for cards, bars, drawers, dock.
 * Combines the SVG liquid-glass refraction filter with backdrop blur + saturate,
 * a top-down gradient sheen, the signature edge rim, AND a deep ambient drop
 * shadow so the surface clearly lifts off the wallpaper behind it.
 */
export const chromeGlassSurfaceClasses =
  'border border-white/35 bg-white/24 bg-glass-gradient shadow-glass-surface ' +
  'backdrop-blur-glass [backdrop-filter:url(#liquid-glass)_blur(18px)_saturate(170%)] ' +
  '[-webkit-backdrop-filter:url(#liquid-glass)_blur(18px)_saturate(170%)] ' +
  '[transform:translateZ(0)] dark:bg-black/36';

/** Alias for clarity in new call sites. */
export const liquidGlassSurfaceClasses = chromeGlassSurfaceClasses;

// ---------------------------------------------------------------------------
// Tier 2 — THIN (nested panels)
// ---------------------------------------------------------------------------

/**
 * For elements that sit inside an already-blurred surface (todo rows, count tiles,
 * settings sub-cards, theme picker buttons). Skips backdrop-filter on purpose —
 * the parent already blurs the background, and stacking backdrop-filter causes
 * banding in Chromium. Still gets the gradient + rim so it reads as glass.
 */
export const liquidGlassThinClasses =
  'border border-white/20 bg-white/10 shadow-sm ' +
  '[transform:translateZ(0)] dark:bg-white/5';

/** Recessed variant for elements meant to look "pushed in" (progress tracks, slot wells). */
export const liquidGlassRecessClasses =
  'border border-white/[0.12] bg-white/[0.07] shadow-inner ' +
  '[transform:translateZ(0)] dark:bg-black/20';

// ---------------------------------------------------------------------------
// Tier 3 — BUTTON (interactive THIN)
// ---------------------------------------------------------------------------

/**
 * Interactive liquid-glass button. Hover lifts the rim, active presses it in.
 * Compose with `rounded-*` and padding utilities at the call site.
 */
export const liquidGlassButtonClasses =
  'border border-white/20 bg-white/10 shadow-sm ' +
  ' relative cursor-pointer transition duration-150 ease-out ' +
  'hover:bg-white/[0.16] hover:shadow-md ' +
  'active:bg-white/[0.12] active:shadow-sm ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'disabled:hover:bg-white/10 disabled:hover:shadow-sm ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-0';

/** Square icon button (e.g. settings X close, dock arrows). Same chrome, snug paddings handled at call site. */
export const liquidGlassIconButtonClasses = liquidGlassButtonClasses;

// ---------------------------------------------------------------------------
// Tier 4 — INPUT (recessed editable surface)
// ---------------------------------------------------------------------------

/**
 * Editable surface — recessed look so it reads as a slot. Focus ring is colored
 * via `--tw-ring-color` so callers can theme it (matches how the rest of the app
 * does themed focus rings).
 */
export const liquidGlassInputClasses =
  'border border-white/20 bg-white/10 shadow-inner ' +
  'text-slate-900 outline-none placeholder:text-slate-700/60 ' +
  'transition focus:bg-white/15 focus:ring-2 focus:border-white/40 ' +
  '[transform:translateZ(0)] dark:bg-black/25 dark:text-slate-100 dark:placeholder:text-slate-300/55';

// ---------------------------------------------------------------------------
// Tier 5 — CHIP (small pill / status badge)
// ---------------------------------------------------------------------------

/**
 * Small frosted pill — for status badges, tags, count indicators.
 * Uses the same rim language so it feels carved from the same material.
 */
export const liquidGlassChipClasses =
  'border border-white/25 bg-white/15 shadow-sm ' +
  '[transform:translateZ(0)] dark:bg-white/10';

// ---------------------------------------------------------------------------
// Tier 6 — POPOVER (dark menus, tooltips, context menus)
// ---------------------------------------------------------------------------

/**
 * Dark popover surface — tooltips and context menus where the content needs
 * higher contrast. Heavier drop shadow to read clearly above any backdrop.
 */
export const liquidGlassPopoverClasses =
  'border border-white/15 bg-black/35 shadow-2xl backdrop-blur-md ' +
  '[transform:translateZ(0)] text-slate-100';

// ---------------------------------------------------------------------------
// Radii (Apple uses bigger, more rounded shapes — these match their hierarchy)
// ---------------------------------------------------------------------------

/** Draggable widget shells (e.g. `GlassCard`). */
export const chromeGlassRadiusCard = 'rounded-3xl';

/** Horizontal strips: bookmark bar, dock tray. */
export const chromeGlassRadiusBar = 'rounded-2xl';

/** Settings drawer: floating inset panel with rounded corners. */
export const chromeGlassRadiusSettings = 'rounded-2xl';

/** Buttons, inputs, sub-cards. */
export const liquidGlassRadiusControl = 'rounded-xl';

/** Small chips, count tiles, dock buttons. */
export const liquidGlassRadiusChip = 'rounded-lg';
