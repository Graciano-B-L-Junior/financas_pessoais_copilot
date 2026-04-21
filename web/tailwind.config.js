/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        'bg-page':        'var(--color-bg-page)',
        'bg-card':        'var(--color-bg-card)',
        'bg-sidebar':     'var(--color-bg-sidebar)',
        'border-default': 'var(--color-border)',
        'text-primary':   'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted':     'var(--color-text-muted)',
        primary:          'var(--color-primary)',
        'primary-dark':   'var(--color-primary-dark)',
      },
    },
  },
  plugins: [],
}
