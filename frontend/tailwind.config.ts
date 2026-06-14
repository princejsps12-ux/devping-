import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: {
          DEFAULT: 'var(--surface)',
          hover: 'var(--surface-hover)',
        },
        // Accent + status are stored as RGB channels so opacity modifiers
        // (e.g. bg-accent/10, ring-accent/40) work in both themes.
        accent: 'rgb(var(--accent) / <alpha-value>)',
        status: {
          up: 'rgb(var(--status-up) / <alpha-value>)',
          down: 'rgb(var(--status-down) / <alpha-value>)',
          degraded: 'rgb(var(--status-degraded) / <alpha-value>)',
        },
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
      },
      borderColor: {
        DEFAULT: 'var(--border)',
        hover: 'var(--border-hover)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // Crisp 14px body with generous line-height
        sm: ['0.875rem', { lineHeight: '1.6' }],
        base: ['0.9375rem', { lineHeight: '1.65' }],
      },
      letterSpacing: {
        tight: '-0.02em',
        tighter: '-0.03em',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.55' },
          '80%, 100%': { transform: 'scale(2.4)', opacity: '0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      transitionDuration: {
        DEFAULT: '180ms',
      },
    },
  },
  plugins: [],
};

export default config;
