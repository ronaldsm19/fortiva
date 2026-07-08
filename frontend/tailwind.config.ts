import type { Config } from 'tailwindcss';

/**
 * Los colores se resuelven a variables CSS definidas en globals.css
 * (:root para claro, [data-theme="dark"] para oscuro). Así el toggle de
 * tema solo cambia el atributo data-theme y todo el sistema reacciona.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-2': 'var(--bg-2)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        text: 'var(--text)',
        'text-2': 'var(--text-2)',
        'text-3': 'var(--text-3)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        accent: 'var(--accent)',
        'accent-weak': 'var(--accent-weak)',
        'accent-strong': 'var(--accent-strong)',
        'accent-ink': 'var(--accent-ink)',
        pos: 'var(--pos)',
        'pos-weak': 'var(--pos-weak)',
        neg: 'var(--neg)',
        'neg-weak': 'var(--neg-weak)',
        gold: 'var(--gold)',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '18px',
        'card-lg': '22px',
        input: '11px',
        chip: '10px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(40,33,24,.05)',
        DEFAULT: '0 1px 2px rgba(40,33,24,.04), 0 10px 26px rgba(40,33,24,.06)',
        lg: '0 4px 14px rgba(40,33,24,.06), 0 30px 70px rgba(40,33,24,.12)',
      },
      maxWidth: {
        app: '1240px',
        landing: '1180px',
      },
    },
  },
  plugins: [],
};

export default config;
