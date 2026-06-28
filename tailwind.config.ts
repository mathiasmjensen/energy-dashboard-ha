import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dashboard: {
          bg: '#020913',
          panel: '#131b25',
          line: '#253142',
          text: '#f7fbff',
          muted: '#9ba8b8',
          soft: '#c6d0dc',
          blue: '#6b8bff',
          green: '#57dd70',
          orange: '#f7b62f',
          purple: '#9a5cff',
        },
      },
      boxShadow: {
        glass: '0 12px 26px rgba(0, 0, 0, 0.3)',
        panel: '0 30px 70px rgba(0, 0, 0, 0.38)',
      },
      borderRadius: {
        panel: '10px',
        chip: '999px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      backgroundImage: {
        'glass-panel':
          'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0)), linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0))',
        'glass-card':
          'linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.014))',
      },
    },
  },
  plugins: [],
} satisfies Config
