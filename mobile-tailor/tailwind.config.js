// Single theme file: tokens copied from frontend/src/styles/index.css (@theme)
// Consumed by twrnc through src/lib/tw.js.
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#843D9B', dark: '#6B2F7E', light: '#9B5BB0', soft: '#F3EAF8' },
        secondary: '#6B2F7E',
        accent: '#D4AF37',
        evergreen: { DEFAULT: '#061B0E', container: '#1B3022' },
        sage: '#506354',
        alabaster: '#FAF9F7',
        stone: '#EFEEEC',
        gold: '#B18D48',
        'sw-primary': { DEFAULT: '#843D9B', container: '#6B2F7E', fixed: '#f0dbff', 'fixed-dim': '#dcb8ff' },
        'sw-on-primary': { DEFAULT: '#ffffff', container: '#d2a4ff' },
        'sw-surface': { DEFAULT: '#fcf9f8', container: '#f0eded', 'container-low': '#f6f3f2', 'container-high': '#eae7e7', tint: '#843D9B' },
        'sw-on-surface': { DEFAULT: '#1c1b1b', variant: '#4c4451' },
        'sw-outline': { DEFAULT: '#7d7483', variant: '#cec3d3' },
        'sw-secondary': { DEFAULT: '#6B2F7E', container: '#e9def5' },
        'sw-tertiary': { DEFAULT: '#843D9B', container: '#843D9B' },
        'sw-inverse-primary': '#dcb8ff',
      },
      spacing: { 18: '4.5rem', 22: '5.5rem' },
      fontFamily: {
        sans: ['Poppins'],
        serif: ['LibreCaslonText'],
        body: ['Manrope'],
        jakarta: ['PlusJakartaSans'],
      },
    },
  },
};
