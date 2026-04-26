import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./entrypoints/**/*.{html,ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      backdropBlur: {
        ios: '40px',
        glass: '40px',
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
        glass:
          'inset 0 1px 1px rgba(255,255,255,0.4), 0 20px 40px rgba(15, 23, 42, 0.28)',
      },
      backgroundImage: {
        'glass-gradient':
          'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 100%)',
        'mesh-indigo': 'radial-gradient(circle at 30% 30%, rgba(99,102,241,0.75), transparent 60%)',
        'mesh-teal': 'radial-gradient(circle at 70% 40%, rgba(20,184,166,0.65), transparent 60%)',
        'mesh-pink': 'radial-gradient(circle at 40% 70%, rgba(236,72,153,0.62), transparent 60%)',
      },
    },
  },
  plugins: [],
};

export default config;
