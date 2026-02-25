import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F9F8F6',
        surface: '#FFFFFF',
        border: '#E5E2DC',
        primary: '#1A1917',
        muted: '#7A7670',
        accent: '#C8B89A',
        'accent-dim': '#8A7A64',
        'friction-low': '#2D6A4F',
        'friction-mid': '#B45309',
        'friction-high': '#991B1B',
        'friction-low-bg': '#F0F7F4',
        'friction-mid-bg': '#FEF3E2',
        'friction-high-bg': '#FEF2F2',
      },
      fontFamily: {
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['12px', { lineHeight: '16px', letterSpacing: '0.02em' }],
        xs:   ['14px', { lineHeight: '20px' }],
        sm:   ['16px', { lineHeight: '24px' }],
        md:   ['20px', { lineHeight: '28px' }],
        lg:   ['28px', { lineHeight: '34px', letterSpacing: '-0.01em' }],
        xl:   ['40px', { lineHeight: '46px', letterSpacing: '-0.02em' }],
      },
      spacing: {
        '18': '72px',
        section: '64px',
        card: '32px',
        inner: '24px',
        micro: '12px',
      },
      maxWidth: {
        content: '720px',
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '4px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(26,25,23,0.06), 0 1px 2px -1px rgba(26,25,23,0.04)',
        'card-hover': '0 4px 12px 0 rgba(26,25,23,0.08)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
