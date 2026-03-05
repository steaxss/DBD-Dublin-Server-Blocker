/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'monospace'],
      },
      colors: {
        apple: {
          bg:        '#1c1c1e',
          elevated:  '#2c2c2e',
          elevated2: '#3a3a3c',
          fill:      '#48484a',
          sep:       'rgba(255,255,255,0.12)',
          red:       '#ff453a',
          green:     '#32d74b',
          blue:      '#0a84ff',
        },
      },
    },
  },
  plugins: [],
}
