import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./entrypoints/**/*.{html,ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      backdropBlur: {
        ios: '40px',
        glass: '40px',
        'glass-thin': '12px',
      },
      blur: {
        glass: '40px',
      },
      saturate: {
        ios: '1.8',
      },
      colors: {
        blob: {
          indigo: '#6366f1',
          teal: '#14b8a6',
          pink: '#ec4899',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.2)',
          dark: 'rgba(0, 0, 0, 0.4)',
          border: 'rgba(255, 255, 255, 0.3)',
        },
      },
      boxShadow: {
        // Heavy floating surface (cards, bars, drawers) — bright top rim, deep ambient lift.
        glass:
          'inset 0 1px 1px rgba(255,255,255,0.4), 0 20px 40px rgba(15, 23, 42, 0.28)',
        // Liquid Glass edge — the signature specular rim. Bright top, faint bottom, soft side falloff.
        'glass-edge':
          'inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -0.5px 0 rgba(255,255,255,0.06), inset 1px 0 0.75px rgba(255,255,255,0.18), inset -1px 0 0.75px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.18)',
        // Lifted variant (interactive hover) — pushes the rim brighter and adds a small drop.
        'glass-edge-lifted':
          'inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -0.5px 0 rgba(255,255,255,0.1), inset 1px 0 0.75px rgba(255,255,255,0.25), inset -1px 0 0.75px rgba(0,0,0,0.12), 0 4px 14px -4px rgba(0,0,0,0.35)',
        // Recessed variant (inputs, progress tracks, todo rows) — dark inner well, faint bottom highlight.
        'glass-recess':
          'inset 0 1px 1.5px rgba(0,0,0,0.18), inset 0 -1px 0 rgba(255,255,255,0.10), inset 1px 0 0.75px rgba(0,0,0,0.06), inset -1px 0 0.75px rgba(0,0,0,0.06)',
        // Pressed-in / active state — squashes the highlight, adds inner shadow for tactile feedback.
        'glass-edge-pressed':
          'inset 0 1px 1.5px rgba(0,0,0,0.20), inset 0 0 0 0.5px rgba(255,255,255,0.12), 0 0 0 rgba(0,0,0,0)',
        // Tooltip / context-menu tier — heavier ambient drop, no top rim.
        'glass-pop':
          'inset 0 0.5px 0 rgba(255,255,255,0.18), 0 18px 38px -10px rgba(0,0,0,0.55), 0 4px 12px -4px rgba(0,0,0,0.45)',
      },
      backgroundImage: {
        // Diagonal glass gradient — light enters from top-left, fades toward bottom-right.
        'glass-gradient':
          'linear-gradient(135deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.10) 100%)',
        // Thinner diagonal version for nested chips/buttons.
        'glass-gradient-thin':
          'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 55%, rgba(255,255,255,0.08) 100%)',
        // Recessed diagonal gradient — slight darkening near top-left for the "well" look.
        'glass-gradient-recess':
          'linear-gradient(135deg, rgba(0,0,0,0.10) 0%, rgba(255,255,255,0.04) 100%)',
        // Dark diagonal glass (tooltip / menu) — deep tint with a faint highlight.
        'glass-gradient-dark':
          'linear-gradient(135deg, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.92) 100%)',
        'mesh-indigo': 'radial-gradient(circle at 30% 30%, rgba(99,102,241,0.75), transparent 60%)',
        'mesh-teal': 'radial-gradient(circle at 70% 40%, rgba(20,184,166,0.65), transparent 60%)',
        'mesh-pink': 'radial-gradient(circle at 40% 70%, rgba(236,72,153,0.62), transparent 60%)',
      },
    },
  },
  plugins: [],
};

export default config;
