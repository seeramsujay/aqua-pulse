/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        'bg-root':      '#071018',
        'bg-surface':   '#0B1720',
        'bg-panel':     '#0E1C25',
        'bg-elevated':  '#12232D',
        'bg-inset':     '#091319',
        'border-default': '#20333D',
        'border-subtle':  '#182A34',
        'border-strong':  '#2A4050',
        cyan:           '#43C7D9',
        'cyan-muted':   '#2A8997',
        'cyan-dim':     '#1A5F6B',
        positive:       '#63C79A',
        warning:        '#D9A441',
        critical:       '#D96B6B',
        'text-primary': '#E7EEF1',
        'text-secondary': '#A9BBC3',
        'text-muted':   '#71858F',
        'text-dim':     '#4A6270',
        'chart-amber':  '#D9A441',
        'chart-emerald': '#63C79A',
        'chart-violet': '#9B8EC4',
        'chart-rose':   '#D96B6B',
        'chart-cyan':   '#43C7D9',
      },
    },
  },
  plugins: [],
}
