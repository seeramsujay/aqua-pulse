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
        ocean: {
          surface: '#0d253f',
          shallow: '#091c32',
          thermocline: '#051324',
          deep: '#030b15',
          abyss: '#01050a',
          sonar: '#00ffcc',
          warning: '#ff4d4f',
          gold: '#f59e0b',
        },
        hydro: {
          50:  '#e0fffe',
          100: '#b3fdfa',
          200: '#5ef9f4',
          300: '#00f0ff',
          400: '#00d4f0',
          500: '#00b4d8',
          600: '#0096c7',
          700: '#0077b6',
          800: '#005f91',
          900: '#03045e',
        },
        sonar: {
          green:  '#00ff9d',
          cyan:   '#00f0ff',
          purple: '#bf5af2',
          amber:  '#f5a623',
          red:    '#ff453a',
        },
      },
      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow':     'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'radar-sweep':   'sweep 4s linear infinite',
        'sonar-ring':    'sonarRing 2s ease-out infinite',
        'scan-line':     'scanLine 3s linear infinite',
        'data-flash':    'dataFlash 1.2s ease-in-out',
        'depth-pulse':   'depthPulse 2.5s ease-in-out infinite',
        'float':         'float 6s ease-in-out infinite',
        'glow-pulse':    'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        sweep: {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        sonarRing: {
          '0%':   { transform: 'scale(0.8)', opacity: '0.9' },
          '70%':  { transform: 'scale(1.6)', opacity: '0.3' },
          '100%': { transform: 'scale(2.0)', opacity: '0' },
        },
        scanLine: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        dataFlash: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4', color: '#00f0ff' },
        },
        depthPulse: {
          '0%, 100%': { opacity: '1', transform: 'scaleY(1)' },
          '50%':      { opacity: '0.6', transform: 'scaleY(0.95)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0,240,255,0.3)' },
          '50%':      { boxShadow: '0 0 20px rgba(0,240,255,0.7), 0 0 40px rgba(0,240,255,0.3)' },
        },
      },
      boxShadow: {
        'glow-cyan':    '0 0 20px rgba(0, 240, 255, 0.4)',
        'glow-cyan-sm': '0 0 8px rgba(0, 240, 255, 0.3)',
        'glow-green':   '0 0 20px rgba(0, 255, 157, 0.35)',
        'glow-purple':  '0 0 20px rgba(191, 90, 242, 0.35)',
        'glow-amber':   '0 0 20px rgba(245, 166, 35, 0.35)',
        'glow-red':     '0 0 20px rgba(255, 69, 58, 0.35)',
        'panel':        '0 4px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
        'panel-cyan':   '0 4px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(0,240,255,0.08)',
        'inner-glow':   'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern':    "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300f0ff' fill-opacity='0.03'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
