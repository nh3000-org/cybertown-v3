/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg': 'rgb(var(--bg) / 1)',
        'bg-2': 'rgb(var(--bg-2) / 1)',
        'bg-3': 'rgb(var(--bg-3) / 1)',
        'fg': 'rgb(var(--fg) / 1)',
        'fg-2': 'rgb(var(--fg-2) / 1)',
        'fg-3': 'rgb(var(--fg-3) / 1)',
        'border': 'rgb(var(--border) / 1)',
        'muted': 'rgb(var(--muted) / 1)',
        'highlight': 'rgb(var(--highlight) / 1)',
        'danger': 'rgb(var(--danger) / 1)',
        'overlay': 'rgb(var(--overlay) / 1)',
        'sidebar': 'rgb(var(--sidebar) / 1)',
        'scrollbar': 'rgb(var(--scrollbar) / 1)',
        'accent': {
          'DEFAULT': 'rgb(var(--accent) / 1)',
          'fg': 'rgb(var(--accent-fg) / 1)'
        },
      },
    }
  },
}
